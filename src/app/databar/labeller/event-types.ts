import { EventEmitter } from '@angular/core';
import { TypeMap } from '../interfaces/label.interface'
import { LabelScheme } from "./label-scheme";

// #region [Interfaces]
export type LabelKey = number | string
// #endregion

export class EventMap {
    // #region [Variables]
    name: string;
    null_label: LabelKey;
    null_event: string = LabelScheme.NULL_EVENT;
    private _emap: TypeMap;
    private scheme: LabelScheme;
    // #endregion

    // #region [Constructor]
    constructor(labelscheme: LabelScheme) {
        this.scheme = labelscheme;
        this.name = labelscheme.name;
        this._emap = labelscheme.event_map || {};
        this.null_label = labelscheme.null_label || LabelScheme.NULL_KEY;
    }
    // #endregion

    // #region [Accessors]
    get labelscheme() { return this.scheme }

    get initial() {
        if (!this.is_empty()) return this.event_types()[0];
        else return this.null_label.toString();
    }
    // #endregion

    // #region [Public Methods]
    get(key: LabelKey): string {
        // if null-label, return special string
        if (this.isNull(key)) return this.null_event;
        // check if valid key
        key = EventMap.toInt(key);
        if (!(key in this._emap)) { 
            console.warn('unexpected label key:', key);
            this._emap[key] = key.toString();
        }
        return this._emap[key];
    }

    index(key: LabelKey) {
        let keys = this.event_types(true);
        return keys.indexOf(key.toString());
    }

    event_types(include_null: boolean = false): string[] {
        let types = Object.keys(this._emap);
        if (!include_null) return types;
        else return [this.null_label.toString(), ...types];
    }

    add(name: string) {
        let key = this.nextKey();
        console.debug('adding event type:', key, name);
        this._emap[key] = name;
        return key;
    }

    remove(key: LabelKey) {
        if (key === this.null_label) {
            console.warn('cannot delete null label!', key);
            return;
        }
        let idx = Math.max(this.index(key)-1, 0);
        delete this._emap[key];
        return this.event_types(true)[idx];
    }

    edit(key: LabelKey, name: string) {
        if (this.isNull(key)) this.null_event = name ;
        else this._emap[key] = name;
        return key;
    }
    // #endregion

    // #region [Utility Methods]
    isNull(key: LabelKey): boolean { return key == this.null_label }

    is_empty(): boolean { return this.event_types().length === 0 }
    // #endregion

    // #region [Helper Methods]
    static toInt(key: LabelKey): number {
        if (typeof key === 'string') return parseInt(key);
        else return key;
    }

    private nextKey() {
        let keys = this.event_types(true).map((k) => { return parseInt(k) })
        return Math.max(...keys) + 1
    }
    // #endregion
}