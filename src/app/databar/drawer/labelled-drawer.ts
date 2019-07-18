import { Drawer } from './drawer';
import { DatabarComponent } from '../databar.component';
import { DragBehavior } from './behaviors/drag';
import { MouseBehavior } from './behaviors/mouse';
import { Label } from '../interfaces/label.interface';


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