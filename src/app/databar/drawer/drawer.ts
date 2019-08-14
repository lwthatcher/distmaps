import { DatabarComponent } from '../databar.component';
import { arraysEqual } from '../util/util';
import { time_format } from './time-format';
import { LayerMap } from './layers';
import { HighlightBehavior } from './behaviors/highlight';
import { ZoomBehavior } from './behaviors/zoom';
import * as d3 from "d3";
// imports for labelled-drawer
import { DragBehavior } from './behaviors/drag';
import { MouseBehavior } from './behaviors/mouse';
import { Label } from '../interfaces/label.interface';

// #region [Interfaces]
type UpdateTarget = 'signals' | 'area'
// #endregion

export class Drawer {
  // #region [Variables]
  databar: DatabarComponent;
  layers: LayerMap;
  x; x0;
  y; yd;
  Y = [];
  lines = [];
  lineChart;
  areaChart;
  behaviors;
  // #endregion

  // #region [Constructor]
  constructor(databar: DatabarComponent) {
    this.databar = databar;
    // setup selection layers
    let host = d3.select(databar.element.nativeElement);
    this.layers = new LayerMap(host);
    this.layers.svg
        .attr('height', databar._height);
    this.layers.transform
        .attr("transform", "translate(" + databar.margin.left + "," + databar.margin.top + ")");
    this.layers.zoom
        .attr('width', databar.width)
        .attr('height', databar.height);
    this.layers.clip
        .attr('width', databar.width)
        .attr('height', databar.height);
    // setup behaviors
    this.behaviors = {};
    this.behaviors.highlight = new HighlightBehavior(this);
    this.behaviors.zoom = new ZoomBehavior(this);
    // register non-local behaviors
    this.layers.svg.call(this.behaviors.zoom.zoom)
                   .on("dblclick.zoom", null);
  }
  // #endregion

  // #region [Accessors]
  get signals() { return this.layers.host.selectAll('g.signals > path.line') }

  get w() { return this.databar.width }

  get h() { return this.databar.height }

  get colorer() { return this.databar.colorer }

  get isDomainSet() { return this.x && !arraysEqual(this.x.domain(), [0, 1]) }
  // #endregion

  // #region [Callbacks]
  get key() { return (d,i) => { return d ? d.id : i } }

  get width() { return (d) => { return this.x(d.end) - this.x(d.start) } }

  get middle() { return (d) => { return this.x(d.start + (d.end-d.start)/2) }  }
  // #endregion

  // #region [Public Plotting Methods]
  async draw() {
    this.set_ranges();
    let data = await this.databar.data.then((d: number[][]) => d3.transpose(d));
    let dmap = await this.databar.dmap;
    this.set_domains(data, dmap);
    this.draw_xAxis();
    this.draw_yAxis();
    this.plot_signals(data);
    this.plot_distanceMap(dmap);
  }

  clear(...layers) {
    // if no parameters given, clear everything
    if (layers.length === 0) {
      for (let p of this.layers.primaries) { p.all.remove() }
    }
    else for (let l of layers) {
      let layer = this.layers.get(l);
      layer.all.remove();
    }
  }
  
  draw_xAxis() {
    this.layers.axes.append('g')
        .attr('class', 'x-axis')
        .attr('transform', 'translate(0,' + this.databar.height + ')')
        .call(d3.axisBottom(this.x)
                .tickFormat((d: any) => { return time_format(d) }));
  }

  draw_yAxis() {
    let W = this.w + (this.databar.margin.right *.25)
    this.layers.axes.append('g')
        .attr('class', 'y-axis')
        .call(d3.axisLeft(this.Y[0]));
    if (this.yDims().length > 1) {
      this.layers.axes.append('g')
        .attr('class', 'y-axis')
        .attr("transform", "translate( " + W + ", 0 )")
        .call(d3.axisLeft(this.Y[1]));
    }
  }
  // #endregion

  // #region [Update Methods]
  update(...targets: UpdateTarget[]) {
    // if targets not provided, default to all
    if (targets.length === 0) targets = ['signals', 'area']
    // call appropriate update functions
    for (let target of targets) {
      this._UPDATES[target]();
    }
  }

  private _UPDATES = {
    'signals': () => this.updateSignals(),
    'area': () => this.updateAreaChart()
  }

  private updateSignals() {
    if (this.yDims().length === 1) {
      this.signals.attr("d", this.lines[0])
    }
    else for (let j of this.yDims()) {
      let dim_sigs = this.layers.host.selectAll('g.signals > path.line.line-' + j.toString());
      dim_sigs.attr("d", this.lines[j]);
    }
  }

  private updateAreaChart() {
    let chart = this.layers.gradient.select('path')
    chart.attr('d', this.areaChart);
  }
  // #endregion

  // #region [Signal Plotting Helpers]
  private async plot_signals(_data) {
    // downsample first
    _data = await Promise.resolve(_data);
    let data = this.databar.downsample(_data);
    // draw each signal
    for (let j = 0; j < data.length; j++) {
      this.plot_signal(data[j], j);
    }
  }

  private plot_signal(signal, j) {
    this.layers.signals.append("path")
        .datum(signal)
        .attr("fill", "none")
        .attr("clip-path", "url(#clip)")
        .attr("class", "line line-" + j.toString())
        .attr("stroke", () => { return this.colorer.lineColor(j);} )
        .attr("idx", j)
        .attr("d", this.lines[0])
        .on("mouseover", () => this.behaviors.highlight.mouseover(j))
        .on("mouseout", () => this.behaviors.highlight.mouseout())
  }
  // #endregion

  // #region [Distance Gradient Plotting Helpers]
  private async plot_distanceMap(dists) {
    dists = await Promise.resolve(dists);
    this.layers.gradient.append('path')
        .datum(dists)
        .attr('fill', 'steelblue')
        .attr('clip-path', "url(#clip)")
        .attr('class', 'area distance-map')
        .attr('d', this.areaChart);
    console.debug('dist-map', this.yd.domain(), this.yd.range());
    // console.debug('dmap', dists)
  }
  // #endregion

  // #region [Domains and Ranges]
  set_ranges() {
    // set x-ranges
    this.x = d3.scaleLinear().rangeRound([0, this.w]);
    this.x0 = d3.scaleLinear().rangeRound([0, this.w]);
    // set y-ranges
    for (let j of this.yDims()) {
      this.Y[j] = d3.scaleLinear().rangeRound([this.h, 0]);
    }
    this.yd = d3.scaleLinear().rangeRound([this.h, 0]);
    // setup line-drawing method(s)
    for (let j of this.yDims()) {
      this.lines[j] = d3.line().x((d,i) => this.x(i))
                               .y((d) => this.Y[j](d))
    }
    // setup distance-map area plot
    // TODO: don't hard-code min!
    let min = this.yd(0) // yd(0) for non-log scale..?
    this.areaChart = d3.area().x((d,i) => this.x(i))
                              .y0(min)
                              .y1((d) => this.yd(d))
  }

  set_domains(data, dmap?) {
    // setup x-domains
    // TODO: extract data accessor approaches
      // let max = data[0][data[0].length-1].i;
    // convenience accessor
    let _d = (d:any) => d
    // x-domains
    let max = data[0].length;
    this.x.domain([0, max]);
    this.x0.domain(this.x.domain());
    // combined y-domains (default)
    if (this.yDims().length === 1) {
      this.Y[0].domain([d3.min(data, (ax: any) => d3.min(ax, _d)), 
                        d3.max(data, (ax: any) => d3.max(ax, _d))]);
    }
    // individual y-domains
    else for (let j of this.yDims()) {
      this.Y[j].domain([d3.min(data[j], _d), 
                        d3.max(data[j], _d)])
    }
    // y-domain for distance area chart (if provided)
    if (dmap) {
      this.yd.domain([d3.min(dmap, _d), d3.max(dmap, _d)])
    }
  }

  // TODO: replace set_domains()/set_ranges() calls to this one call
  private set_scales(data, dmap?) {
    // convenience accessors
    let _d = (d:any) => d
    
    // extract values
    let xmax = data[0].length;
    let dataMin = +d3.min(data, (ax: any) => d3.min(ax, _d));
    let dataMax = +d3.max(data, (ax: any) => d3.max(ax, _d));
    let distMin = dmap?  Math.min(0, +d3.min(dmap, _d)) : 0;
    let distMax = dmap? +d3.max(dmap, _d) : 1;
    // set x-scales
    this.x = d3.scaleLinear()
               .rangeRound([0, this.w])
               .domain([0, xmax]);
    this.x0 = d3.scaleLinear()
                .rangeRound(this.x.range())
                .domain(this.x.domain());
    // set y-scales
    this.y = d3.scaleLinear()
               .rangeRound([this.h, 0])
               .domain([dataMin, dataMax]);
    this.yd = d3.scaleLinear()
                .rangeRound([this.h, 0])
                .domain([distMin, distMax]);
    // setup line-chart
    this.lineChart = d3.line()
                       .x((d,i) => this.x(i))
                       .y((d) => this.y(d));
    // setup distance area-chart
    this.areaChart = d3.area()
                       .x((d,i) => this.x(i))
                       .y0(distMin)
                       .y1((d) => this.yd(d))

  }

  private yDims() {
    // TODO: sensors parsing check
    // if (this.sensor.channel === 'B') return [0, 1];
    // else return [0];
    return [0];
  }
  // #endregion

  // #region [Utility Methods]
  xy(event?): [number, number] {
    if (event) return d3.clientPoint(this.layers.zoom.node(), event);
    else return d3.mouse(this.layers.zoom.node());
  }

  region() {
    // get x,y
    let [x,y] = this.xy();
    // return region based on precedence
    if (x < 0) return 'y-axis';
    if (y < 0) return 'margin-top';
    if (x > this.w) return 'margin-right';
    if (y > this.h) return 'x-axis';
    return 'frame';
  }

  clicked(event) { console.debug('click no-op', event); }
  // #endregion

  // #region [Helper Methods]
  private domains_and_ranges() {
    let dr = (d) => {return [d.domain(), d.range()]}
    let ys = this.Y.map((y) => dr(y))
    return {x: dr(this.x), x0: dr(this.x0), Y: ys} 
  }

  logInfo() {
    console.groupCollapsed('drawer');
    console.log('domains/ranges', this.domains_and_ranges());
    console.log('layers:', this.layers);
    console.log('line(s):', this.lines);
    console.log('behaviors:', this.behaviors);
    console.log('drawer:', this);
    console.groupEnd();
  }
  // #endregion
}

/**
 * Extension of the Drawer class that also handles label drawing and interfaces.
 * If no labels are expected, use the Drawer class instead.
 */
export class LabelledDrawer extends Drawer {
  // #region [Accessors]
  get mode() { return this.databar.mode }

  get labeller() { return this.databar.labeller }

  get ls() { return this.labeller ? this.labeller.ls : null }

  get labels() { return this.ls ? this.ls.labels : [] }

  get label_type() { return this.ls.eventType }

  get selected_label(): Label | boolean { return this.labeller.selected_label }

  // TODO: implement
  get show_labels() { return false }
  get fill() { return 'blue' }
  // #endregion

  // #region [Constructor]
  constructor(databar: DatabarComponent) {
      super(databar);
      this.behaviors.drag = new DragBehavior(this);
      this.behaviors.mouse = new MouseBehavior(this);
      this.layers.svg.call(this.behaviors.mouse.mouse);
  }
  // #endregion

  // #region [Overrides]
  async draw() {
    super.draw();
    this.draw_labels();
    this.draw_handles();
  }

  /** alias method for drawer.behaviors.mouse.clicked() */
  clicked(event) { this.behaviors.mouse.clicked(event) }
  // #endregion

  // #region [Public Methods]
  draw_labels() {
      if (!this.labels) { return }
      if (!this.isDomainSet) { return }
      if (!this.show_labels) { this.clear('labels'); return; }
      
      let lbls = this.selectAllLabels();
      this.onExit(lbls);
      this.onEnter(lbls);
  }

  draw_handles(lbl?: Label) {
      // erase handles if show-labels is false
      if (!this.selected_label) { this.clear('handles'); return; }
      if (!this.show_labels) { this.clear('handles'); return; }
      // if no label is selected, clear the handles and return
      if (!lbl) { lbl = this.selected_label as Label }
      if (!lbl) { this.clear('handles'); return; }
      // selections
      let left: d3.Selection<any,any,any,any> = this.layers.handles.selectAll('rect.drag-handle.left').data([lbl]);
      let right: d3.Selection<any,any,any,any> = this.layers.handles.selectAll('rect.drag-handle.right').data([lbl]);
      let both = this.layers.handles.selectAll('rect.drag-handle');
      // draw left/right handles
      left = this._add_handle(left, 'left');
      right = this._add_handle(right, 'right');
      // conditionally format if width == 0
      if (lbl.start === lbl.end) { both.classed('warn', true) }
      else { both.classed('warn', false) }
  }

  draw_cursor(cursor) {
      this.clear('cursor');
      if (!cursor) { return }
      // only draws cursor
      let [x,y] = this.xy();
      let selection = this.layers.cursor;
      selection.append('svg')
                  .attr('class', 'cursor')
                  .attr('width', 24)
                  .attr('height', 24)
                  .attr('x', x-12)
                  .attr('y', y-12)
                  .attr('viewBox', "0 0 24 24")
                  .append('path')
                  .attr('d', cursor);
  }
    
  draw_ghost() {
      this.clear('ghost');
      if (!this.mode.click) { return }
      let [x,y] = this.xy();
      let [start,end] = this.labeller.bounds(x);
      let label = this.label_type;
      this.layers.ghost.append('rect')
          .datum({start, end, label})
          .attr('class', 'ghost-label')
          .attr('y', 0)
          .attr('height', this.databar.height)
          .attr('x', (d) => { return this.x(d.start) })
          .attr('width', this.width)
          .attr('fill', this.fill);
  }
  // #endregion

  // #region [Update Methods]
  updateLabels() {
    let width = (d) => { return this.x(d.end) - this.x(d.start) }
    this.layers.labels
        .selectAll('rect.label')
        .attr('x', (d: any) => { return this.x(d.start) })
        .attr('width', width)
  }

  updateLabel(label: Label) {
    let lbl = this.selectLabel(label)
                  .transition()
                  .duration(100)
                  .attr('x', (d) => { return this.x(d.start) })
                  .attr('width', this.width);
  }
  // #endregion

  // #region [Drag Handle Plotting Helpers]
  private _add_handle(selection: d3.Selection<any,any,any,any>, side: 'left' | 'right') {
    let callback;
    if (side === 'left') callback = (d) => { return this.x(d.start) - 5 }
    else callback = (d) => { return this.x(d.end) - 5 }
    return selection.enter().append('rect')
                    .attr('width', 10)
                    .classed('drag-handle', true)
                    .classed(side, true)
                    .attr('y', 0)
                    .attr('height', this.databar.height)
                    .call(this.behaviors.drag.resize[side])
                    .merge(selection)
                    .attr('x', callback)
  }
  // #endregion

  // #region [Labels Plotting Helpers]
  private selectAllLabels() {
    //ts-ignore
    let rects = this.layers.labels
                    .selectAll('rect.label')
                    .data(this.labels, this.key)
                    .attr('x', (d: any) => { return this.x(d.start) })
                    .attr('width', this.width)
                    .attr('fill', this.fill)
                    .classed('selected', (d: any) => d.selected )
    return rects;
  }

  private selectLabel(lbl: Label) {
    return this.layers.labels.select('rect.label[lbl-id="' + lbl.id.toString() + '"]');
  }

  private onExit(lbls) {
    lbls.exit()
        .transition()
        .duration(250)
        .attr('width', 0)
        .attr('x', this.middle)
        .remove();
  }

  private onEnter(lbls) {
    let enter = lbls.enter()
                    .append('rect')
                    .attr('y', 0)
                    .attr('height', this.databar.height)
                    .attr('lbl-id', (d) => d.id)
                    .attr("clip-path", "url(#clip)")
                    .classed('label', true)
                    .on('click', (d) => { this.behaviors.mouse.lbl_clicked(d) })
                    .call(this.behaviors.drag.move)
                    .attr('x', this.middle)
                    .attr('width', 0)
                    .classed('selected', (d) => d.selected )
                    .attr('fill', this.fill)
    // add title pop-over
    enter.append('svg:title')
         .text((d) => {return d.type + ' event' || 'event ' + d.label.toString()})
    // transition
    enter.transition()
         .duration(250)
         .attr('x', (d) => { return this.x(d.start) })
         .attr('width', this.width)
    return enter;
  }
  // #endregion
}
