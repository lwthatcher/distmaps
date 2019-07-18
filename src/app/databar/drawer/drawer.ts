import { DatabarComponent } from '../databar.component';
import { Label } from '../interfaces/label.interface';
import { arraysEqual } from '../util/util';
import { time_format } from './time-format';
import { LayerMap } from './layers';
import { HighlightBehavior } from './behaviors/highlight';
import { ZoomBehavior } from './behaviors/zoom';
import * as d3 from "d3";

export class Drawer {
  // #region [Variables]
  databar: DatabarComponent;
  layers: LayerMap;
  x; x0;
  y;
  Y = [];
  lines = [];
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
    // this.behaviors.drag = new DragBehavior(this);
    // this.behaviors.pour = new PourBehavior(this);
    // this.behaviors.mouse = new MouseBehavior(this);
    this.behaviors.zoom = new ZoomBehavior(this);
    // register non-local behaviors
    // this.layers.svg.call(this.behaviors.mouse.mouse);
    this.layers.svg.call(this.behaviors.zoom.zoom)
                   .on("dblclick.zoom", null);
  }
  // #endregion

  // #region [Accessors]
  get signals() { return this.layers.host.selectAll('g.signals > path.line') }

  get energyWells() { return this.layers.host.selectAll('g.energy > path.energy') }

  get w() { return this.databar.width }

  get h() { return this.databar.height }

  get colorer() { return this.databar.colorer }

  get isDomainSet() { return this.x && !arraysEqual(this.x.domain(), [0, 1]) }
  // #endregion

  // #region [Callbacks]
  get key() { return (d,i) => { return d ? d.id : i } }

  get width() { return (d) => { return this.x(d.end) - this.x(d.start) } }

  get middle() { return (d) => { return this.x(d.start + (d.end-d.start)/2) }  }

  // TODO: implement colorer
  get fill() { return 'blue' }
  // #endregion

  // #region [Public Plotting Methods]
  async draw() {
    this.set_ranges();
    let data = await this.databar.data.then((d: number[][]) => d3.transpose(d))
    this.set_domains(data);
    this.draw_xAxis();
    this.draw_yAxis();
    this.plot_signals(data);
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
  updateSignals() {
    if (this.yDims().length === 1) {
      this.signals.attr("d", this.lines[0])
    }
    else for (let j of this.yDims()) {
      let dim_sigs = this.layers.host.selectAll('g.signals > path.line.line-' + j.toString());
      dim_sigs.attr("d", this.lines[j]);
    }
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

  // #region [Domains and Ranges]
  set_ranges() {
    // set x-ranges
    this.x = d3.scaleLinear().rangeRound([0, this.w]);
    this.x0 = d3.scaleLinear().rangeRound([0, this.w]);
    // set y-ranges
    for (let j of this.yDims()) {
      this.Y[j] = d3.scaleLinear().rangeRound([this.h, 0]);
    }
    // setup line-drawing method(s)
    for (let j of this.yDims()) {
      this.lines[j] = d3.line().x((d,i) => this.x(i))
                               .y((d) => this.Y[j](d))
    }
  }

  set_domains(axes) {
    // setup x-domains
    // TODO: extract data accessor approaches
      // let max = axes[0][axes[0].length-1].i;
    let max = axes[0].length;
    this.x.domain([0, max]);
    this.x0.domain(this.x.domain());
    // combined y-domains (default)
    if (this.yDims().length === 1) {
      this.Y[0].domain([d3.min(axes, (ax: any) => d3.min(ax, (d: any) => d)), 
                        d3.max(axes, (ax: any) => d3.max(ax, (d: any) => d))]);
    }
    // individual y-domains
    else for (let j of this.yDims()) {
      this.Y[j].domain([d3.min(axes[j], (d: any) => d), 
                        d3.max(axes[j], (d: any) => d)])
    }
  }

  private yDims() {
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
