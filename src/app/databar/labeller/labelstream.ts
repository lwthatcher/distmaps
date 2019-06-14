import { EventEmitter } from '@angular/core';
import { EventMap, LabelKey } from './event-types';
import { LabelScheme } from "./label-scheme";

// #region [Interfaces]
export interface Label {
    start: number;
    end: number;
    label: number;
    type?: string;
    selected?: boolean;
    id?: number;
}

export interface LabelStreamEvent {
    type: string;
    source: string;
    changed: boolean;
    target?: Label;
}
// #endregion

export class LabelStream {
    // #region [Constants]
    NON_EDITS = ["change-type", "set-labels"]
    // #endregion

    // #region [Variables]
    name: string;
    labels: Label[];
    event = new EventEmitter<LabelStreamEvent>();
    emap: EventMap;
    changed: boolean;
    private _type: LabelKey;
    private _i: number;
    // #endregion

    // #region [Constructor]
    constructor(name:string, scheme: LabelScheme, labels: Label[] = []) {
        this.name = name;
        this.emap = new EventMap(scheme);
        this._type = this.emap.initial;
        this.set_labels(labels);
        this.changed = false;
        this.event.subscribe((e) => this.updated(e))
    }
    // #endregion

    // #region [Accessors]
    get eventType(): number { return EventMap.toInt(this._type) }

    get isEmpty(): boolean { return this.labels.length === 0 }

    get scheme(): LabelScheme { return this.emap.labelscheme }
    // #endregion

    // #region [Label Editting]
    set_labels(labels: Label[]) {
        this.labels = labels.map((lbl,i) => { lbl.id = i; return lbl })
        this._i = this.labels.length;
        this.emit('set-labels');
    }

    remove(lbl: Label) { 
        this.labels = this.labels.filter((l) => { return l.id !== lbl.id })
    }

    add(lbl: Label) {
        if (this.exists(lbl)) {console.warn('this label already exists', lbl); return; }
        lbl.id = this._i;
        this._i++;
        this.labels.push(lbl);
        return lbl;
    }
    // #endregion

    // #region [Selected Event Type]
    change_type(type: LabelKey) {
        this._type = type;
        this.emit('change-type');
    }

    cycle() {
        let types = this.emap.event_types(true);
        let idx = types.findIndex((type) => {return type === this._type }) + 1
        if (idx >= types.length) idx = 0;
        this._type = types[idx];
        this.emit('change-type');
    }

    cycleDown() {
        console.log('cycle down!')
        let types = this.emap.event_types(true);
        let idx = types.findIndex((type) => {return type === this._type }) - 1
        if (idx < 0) idx = types.length-1;
        this._type = types[idx];
        this.emit('change-type');
    }
    // #endregion

    // #region [Event Handlers]
    private updated(event) {
        if (event.changed) { this.changed = true; }
    }
    // #endregion

    // #region [Utility Methods]
    emit(type: string, target?, changed?) {
        if (!this.defined(changed))
            changed = this.inferChanged(type);
        let event: LabelStreamEvent = {type, changed, source: this.name}
        if (!!target) { event.target = target }
        this.event.emit(event);
    }

    findType(type: LabelKey) {
        let label = EventMap.toInt(type)
        return this.labels.filter((lbl) => {return lbl.label == label})
    }

    toJSON() {
        let simplify = (lbl) => {return {start: lbl.start, end: lbl.end, label: lbl.label} }
        let lbls = this.labels.map(simplify);
        lbls = this.sort(lbls);
        return JSON.stringify(lbls);
    }

    rename(name: string) {
        this.name = name;
        this.scheme.name = name;
        this.changed = true;
    }
    // #endregion

    // #region [Helper Methods]
    /** checks whether another label with the same start/end time already exists */
    private exists(lbl) {
        let idx = this.labels.findIndex((l) => {
            return l.start === lbl.start 
                && l.end   === lbl.end 
        })
        return (idx > -1)
    }

    /** sorts the labels by their start time */
    private sort(labels) {
        let compare = (a,b) => { return a.start - b.start }
        labels.sort(compare);
        return labels;
    }

    private defined(variable) { return !(typeof variable === 'undefined' || variable === null) }

    private inferChanged(type: string) {
        return !(type === 'change-type' || type === 'set-labels')
    }
    // #endregion
}