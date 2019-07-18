import { Drawer, LabelledDrawer } from "../drawer";
import * as d3 from "d3";
import { ModeTracker } from '../../modes/tool-mode';

export class ZoomBehavior {
    
  // #region [Properties]
  drawer: Drawer;
  zoom;
  private z_start;
  private _mode;
  // #endregion

  // #region [Constructor]
  /** should be setup after pour and mouse behaviors */
  constructor(drawer: Drawer) {
      this.drawer = drawer;
      this.zoom = this.setup_zoom();
      console.debug('init zoom behavior', this);
  }
  // #endregion

  // #region [Accessors]
  get mode() {
    if (this.drawer instanceof LabelledDrawer) { return this.drawer.mode }
    // TODO: local mode hack kind of smells...
    this._mode = this._mode || new ModeTracker();
    return this._mode;
  }
  // #endregion

  // #region [Zoom Behaviors]
  setup_zoom() {
      return d3.zoom().scaleExtent([1, 50])
                      .translateExtent([[0, 0], [this.drawer.w, this.drawer.h]])
                      .extent([[0, 0], [this.drawer.w, this.drawer.h]])
                      .on('zoom', () => this.zoomed())
                      .on('start', () => this.zoom_start())
                      .on('end', () => this.zoom_end())
    }
  
  zoomed() {
    let region = this.drawer.region();
    let type = d3.event.sourceEvent.type;
    let mode = this.drawer;
    // always allow scroll-wheel zooming
    if (type === 'wheel' && region === 'frame') this.emit_zoom()
    else if (type === 'mousemove') {
        // always allow panning on the x-axis
        if (region === 'x-axis') this.emit_zoom();
        else if (region === 'frame') {
          // allow frame-panning in selection mode
          if (this.mode.selection) this.emit_zoom();
          // otherwise treat as a mouse-move
          if (this.mode.click) this.drawer.behaviors.mouse.mouse_move(); 
        }
    }
    else { 
      console.warn('unexpected zoom-event type:', type, 
        'region:', region,
        'mode:', this.mode.current) 
    }
  }
  
  private emit_zoom() {
    this.drawer.databar.updateZoom(d3.event.transform);
  }
  
  private zoom_start() { this.z_start = Date.now() }
  
  private zoom_end() {
    // if (this.mode.pour) { this.drawer.behaviors.pour.end() }
    let Δt = Date.now() - this.z_start;
    this.z_start = undefined;
  }
  // #endregion

  // #region [Helper Methods]

  // #endregion
}