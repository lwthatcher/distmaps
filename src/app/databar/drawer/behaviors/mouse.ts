import { LabelledDrawer } from "../drawer";
import * as d3 from "d3";

export class MouseBehavior {
    // #region [Constants]
    POINTER = 'M10,2A2,2 0 0,1 12,4V8.5C12,8.5 14,8.25 14,9.25C14,9.25 16,9 16,10C16,10 18,9.75 18,10.75C18,10.75 20,10.5 20,11.5V15C20,16 17,21 17,22H9C9,22 7,15 4,13C4,13 3,7 8,12V4A2,2 0 0,1 10,2Z'
    BRUSH = 'M7 14c-1.66 0-3 1.34-3 3 0 1.31-1.16 2-2 2 .92 1.22 2.49 2 4 2 2.21 0 4-1.79 4-4 0-1.66-1.34-3-3-3zm13.71-9.37l-1.34-1.34c-.39-.39-1.02-.39-1.41 0L9 12.25 11.75 15l8.96-8.96c.39-.39.39-1.02 0-1.41z'
    WATER = 'M12,20C8.69,20 6,17.31 6,14C6,10 12,3.25 12,3.25C12,3.25 18,10 18,14C18,17.31 15.31,20 12,20Z'
    D3_EVENTS = ['zoom', 'drag', 'start', 'end']
    // #endregion

    // #region [Properties]
    drawer: LabelledDrawer;
    mouse;
    // #endregion

    // #region [Constructor]
    
    /** should be setup after pour behavior */
    constructor(drawer: LabelledDrawer) {
        this.drawer = drawer;
        this.mouse = this.setup_mouse();
        console.debug('mouse behavior', this);
    }
    // #endregion

    // #region [Accessors]
    get mouse_event(): MouseEvent {
        let event = d3.event;
        if (this.D3_EVENTS.includes(event.type)) return event.sourceEvent;
        else return event;
    }

    get mode() { return this.drawer.mode }

    get labeller() { return this.drawer.labeller }
    // #endregion

    // #region [Mouse Behaviors]
    setup_mouse() {
        let behavior = (selection) => {
            selection.on('mousemove', () => {this.mouse_move()})
            selection.on('mouseleave', () => {this.mouse_leave()})
            selection.on('mousedown', () => {this.mouse_down()})
            selection.on('mouseup', () => {this.mouse_up()})
            selection.on('dblclick', () => {this.double_click()})
        }
        return behavior;
    }

    private mouse_move() {
        // get the custom cursor path, or null if no custom cursor applies to this setting
        let overlaps = this.overlaps();
        let cursor = this.custom_cursor(this.drawer.region(), this.mode, overlaps);
        if (cursor === this.BRUSH) { this.drawer.clear('ghost') }
        this.drawer.layers.svg.classed('custom-cursor', !!cursor);
        this.drawer.draw_cursor(cursor);
        if (!overlaps) this.drawer.draw_ghost();
    }
    
    private mouse_leave() {
        this.drawer.layers.svg.classed('custom-cursor', false);
        this.drawer.clear('cursor', 'ghost');
        // this.drawer.behaviors.pour.end();
    }
    
    private mouse_down() {
        let buttons = this.mouse_event.buttons
        console.debug('mouse down', buttons);
        if ((buttons & 16) === 16) { this.forward_click() }
        if ((buttons & 8) === 8) { this.backward_click() }
        if ((buttons & 4) === 4) { this.middle_click() }
        if ((buttons & 2) === 2) { this.right_click() }
        if ((buttons & 1) === 1) { this.left_click() }
    }
    
    private mouse_up() {
        console.debug('mouse up', this.mouse_event.button);
        // prevent page-forward
        if (this.mouse_event.button === 4) {
            this.mouse_event.preventDefault();
        }
        // prevent page-backwards
        if (this.mouse_event.button === 3) {
            this.mouse_event.preventDefault();
        }
        // for pour behaviour
        if (this.mouse_event.button === 0) {
            // this.drawer.behaviors.pour.end();
        }
    }
    // #endregion

    // #region [Click Handlers]

    /** general click call-back bound to the SVG */
    clicked(event: MouseEvent) {
        // ignore clicks on labels
        if (this.overlaps(event)) { return }
        // deselect any selected labels
        if (this.labeller) { this.labeller.deselect(); }
        // if label-creation mode, add an event
        if (this.labeller && this.mode.click) {
            let [x,y] = this.drawer.xy(event);
            this.labeller.add(x, this.drawer.label_type);
        }
    }

    /** click call-back for when a label has been clicked */
    lbl_clicked(lbl) {
        if (!this.labeller) { return }
        if (this.mode.selection) this.labeller.select(lbl)
        if (this.mode.click)     this.labeller.change_label(lbl, this.drawer.label_type)
    }

    double_click() {
        console.info('--double click--', d3.event)
        // let event = d3.event;
        // let [x,y] = this.drawer.xy();
        // this.drawer.video.jumpTo(this.drawer.x.invert(x));
        // console.log('double click!', this.drawer.x.invert(x));
    }

    /** call-back for pressing the middle scroll-wheel button */
    middle_click() {
        this.mode.cycle();    // cycle through mode
        this.mouse_move();    // redraw mouse
    }

    /** call-back for pressing the "page-forward" button on the mouse */
    forward_click() { this.drawer.ls.cycle() }

    /** call-back for pressing the "page-backward" button on the mouse */
    backward_click() { this.drawer.ls.cycleDown() }

    /** call-back for performing a right-click on the mouse */
    right_click() { }

    /** call-back for performing a left-click on the mouse */
    left_click() {
        // console.info('--left click [no-op]--', d3.event);
        // if (this.mode.pour) {this.drawer.behaviors.pour.start()}
    }
    // #endregion

    // #region [Helper Methods]
    private custom_cursor(region, mode, overlaps) {
        if (region === 'frame' && mode.click && !overlaps) return this.POINTER;
        if (region === 'frame' && mode.click && overlaps) return this.BRUSH;
        if (region === 'frame' && mode.pour && !overlaps) return this.WATER;
        else return null;
    }
    
    private overlaps(event?: MouseEvent): boolean {
        event = event || this.mouse_event;

        return d3.select(event.target as any).classed('label');
    }
    // #endregion
}