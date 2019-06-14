import { DatabarComponent } from '../databar.component';
import { Label } from '../interfaces/label.interface';
import * as d3 from "d3";

// #region [Interfaces]
interface LabelLike {
    start: number;
    end: number;
}
// #endregion

export class Labeller {
    // #region [Constants]
    FIXED_LABEL_WIDTH = 50;
    // #endregion

    // #region [Constructor]
    databar: DatabarComponent
    constructor(databar: DatabarComponent) { this.databar = databar }
    // #endregion

    // #region [Accessors]
    get ls() { return this.databar.labelstream }

    get labels() { return this.databar.labels }

    get x() { return this.databar.x }

    get selected_label() { return this.databar.selected_label }
    // #endregion

    // #region [Public Methods]
    deselect() {
        // check first if deselected-label has a width of zero
        let selected = this.selected_label;
        if (selected && this.zero_width(selected)) this.delete(selected);
        // set all labels to deselected
        for (let l of this.labels) { l.selected = false }
        this.ls.emit('deselect');
    }
    
    select(lbl) {
        console.debug('selected label', lbl);
        // deselect all other labels
        for (let l of this.labels) { l.selected = false }
        // select this event
        lbl.selected = true;
        // redraw labels and add drag-handles
        this.ls.emit('select');
    }
    
    move(lbl, target) {
        // if no movement we don't have to compute anything
        if (d3.event.dx === 0) return;
        // side = direction it moved
        let side = (d3.event.dx < 0) ? 'left' : 'right';
        // pixel-coordinate variables
        let p0 = parseInt(target.attr('x'));        // original left edge of label
        let pw  = parseInt(target.attr('width'));   // width of label
        let ps = p0 + d3.event.dx;                  // label start
        let pe = ps + pw;                           // label end
        // data-coordinate variables
        let xs = this.x.invert(ps);
        let xe = this.x.invert(pe);
        let w  = xe - xs;
        // don't allow overlap with other labels
        if (side === 'left') {
            xs = this.overlaps(xs, lbl, side);
            xe = xs + w;
        }
        if (side === 'right') {
            xe = this.overlaps(xe, lbl, side);
            xs = xe - w;
        }
        // update label's new bounds
        lbl.start = xs;
        lbl.end = xe;
        // redraw labels and drag-handles
        this.ls.emit('move');
    }
    
    resize(lbl, side: 'left' | 'right') {
        let event = d3.event;
        let dx = this.x.invert(event.x);
        // constraints
        dx = this.min_width(dx, lbl, side);
        dx = this.overlaps(dx, lbl, side);
        // update dragged side
        if (side === 'left') lbl.start = dx;
        if (side === 'right') lbl.end = dx;
        // redraw labels and drag-handles
        this.ls.emit('resize');
    }

    delete(lbl) {
        this.ls.remove(lbl);
        this.ls.emit('delete');
    }

    add(px: number, label: number, size=this.FIXED_LABEL_WIDTH) {
        let [start, end] = this.bounds(px, size);
        // add label
        let type = this.ls.emap.get(label);
        let lbl = { start, end, label, type } as Label
        lbl = this.ls.add(lbl);
        // notify observers
        this.ls.emit('add');
        return lbl;
    }

    grow(lbl: Label, sx, ex) {
        sx = this.x.invert(sx);
        ex = this.x.invert(ex);
        let start = this.overlaps(sx, lbl, 'left');
        let end = this.overlaps(ex, lbl, 'right');
        lbl.start = Math.min(start, lbl.start);
        lbl.end = Math.max(end, lbl.end);
        this.ls.emit('grow', lbl);
        return lbl;
    }

    change_label(lbl: Label, new_label: number) {
        lbl.label = new_label;
        lbl.type = this.ls.emap.get(new_label);
        this.ls.emit('change-label');
    }
    // #endregion

    // #region [Utility Methods]
    bounds(px, size=this.FIXED_LABEL_WIDTH) {
        let dx = this.x.invert(px);
        let start = this.x.invert(px - size/2);
        let end = this.x.invert(px + size/2);
        let temp = {start:dx, end:dx}
        start = this.overlaps(start, temp, 'left');
        end = this.overlaps(end, temp, 'right');
        return [start, end]
    }
    // #endregion

    // #region [Helper Methods]
    private zero_width(lbl: Label) {
        return lbl.start === lbl.end;
    }

    /**
     * ensures that the new width of the label cannot be less than zero
     * (see overlaps() for signature details)
     */
    private min_width(dx: number, lbl: Label, side: 'left' | 'right') {
        if (side === 'left' && dx > lbl.end) dx = lbl.end;
        if (side === 'right' && dx < lbl.start) dx = lbl.start;
        return dx;
    }

    /**
     * reduces the bounds for the specified side to ensure no overlap with other existing labels
     * 
     * @param dx the potential new label position
     * @param lbl the selected label
     * @param side whether moving in the right/left direction
     * @returns updated dx value
     */
    private overlaps(dx: number, lbl: LabelLike, side: 'left' | 'right') {
        for (let l of this.labels) {
            // ignore the selected label
            if (l.selected) continue;
            // check left side overlap 
            if (side === 'left') {
                if (dx > l.start && dx < l.end) dx = l.end;           // overlap (left)
                if (dx < l.start && l.start < lbl.start) dx = l.end;  // consumes (left)
            }
            // check right side overlap
            else {
                if (dx > l.start && dx < l.end) dx = l.start;       // overlap (right)
                if (dx > l.end && lbl.start < l.start) dx = l.start;  // consumes (right)
            }
        }
        return dx;
    }

    logInfo() {
        console.groupCollapsed('labeller');
        console.log('labels:', this.labels);
        console.log('labelstream:', this.ls);
        console.log('labeller:', this);
        console.groupEnd();
    }
    // #endregion
}
