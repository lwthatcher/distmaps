import { invert } from '../util/util';
// import { Synchronizer } from '../../util/sync';
import { TypeMap, LabelKey } from '../interfaces/label.interface';
export class LabelScheme {
    // #region [Constants]
    static NULL_EVENT = 'Ø';
    static NULL_KEY = 0;
    // #endregion

    // #region [Properties]
    workspace: string;
    name: string;
    event_map: TypeMap;
    null_label: LabelKey;
    path?: string;
    video?: string;
    private ws: any;
    // #endregion

    // #region [Constructor]
    constructor(info, ws?) {
        this.ws = ws;
        this.workspace = info.workspace || ws.name;
        this.name = info.name;
        this.event_map = info.event_map;
        if ("path" in info)
            this.path = info.path;
        if ("video" in info)
            this.video = info.video;
        this.null_label = info.null_label || LabelScheme.NULL_KEY;
    }
    // #endregion

    // #region [Accessors]
    get flashes() {
        if (!this.video)
            return [];
        return this.ws.vFlashes(this.video);
    }
    get hasLabels() { return !!this.path; }
    get inv_event_map() { return invert(this.event_map); }
    // #endregion

    // #region [Public Methods]
    // sync(dataset: string): Synchronizer {
    //     let ds = this.ws.getData(dataset);
    //     if (!ds)
    //         return null;
    //     return new Synchronizer(ds.flashes, this.flashes);
    // }
    lblKey(type: string) { return parseInt(this.inv_event_map[type]); }
    // #endregion
}