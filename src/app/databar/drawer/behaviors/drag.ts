import { Drawer, LabelledDrawer } from "../drawer";
import * as d3 from "d3";

// #region [Interfaces]
type side = 'left' | 'right'
// #endregion

export class DragBehavior {
    // #region [Constructor]
    drawer: LabelledDrawer;
    move;
    resize;
    private m_start;
    private r_start;
    constructor(drawer: LabelledDrawer) {
        this.drawer = drawer;
        this.move = this.setup_move();
        this.resize = {}
        this.resize.left = this.setup_resize('left');
        this.resize.right = this.setup_resize('right');
    }
    // #endregion

    // #region [Helper Methods]
    setup_move() {
        return d3.drag().on('drag', (...d) => { this.lbl_move(d) })
                        .on('start', (...d) => { this.move_start(d) })
                        .on('end', (...d) => { this.move_end(d) })
    }
    
    setup_resize(side: side) {
        return d3.drag().on('drag', (d) => { this.lbl_resize(d, side) })
                        .on('start', (...d) => { this.resize_start(d, side) })
                        .on('end', (...d) => { this.resize_end(d, side) })
    }

    lbl_resize(d, side) { this.drawer.labeller.resize(d, side) }

    lbl_move(_d) {
        // can only drag in selection mode
        if (!this.drawer.mode.selection) return;   
        let [d,i,arr] = _d;               
        this.drawer.labeller.move(d, d3.select(arr[i]));
    }

    private move_start(_d) {
        this.m_start = Date.now();
    }

    private move_end(_d) {
        let [d,i,arr] = _d;
        let Δt = Date.now() - this.m_start;
        this.m_start = undefined;
        console.debug('move end:', Δt, [d,i,arr], d3.event);
    }

    private resize_start(d, side) {
        this.r_start = Date.now();
    }

    private resize_end(d, side) {
        let Δt = Date.now() - this.r_start;
        this.r_start = undefined;
        console.debug('resize end:', Δt, d, side);
    }
    // #endregion
}