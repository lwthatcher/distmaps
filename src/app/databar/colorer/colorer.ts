import { DatabarComponent } from '../databar.component';
import * as d3 from "d3";


export class Colorer {
    // #region [Variables]
    databar: DatabarComponent;
    _lines = [];
    // #endregion

    // #region [Constructor]
    constructor(databar: DatabarComponent) {
        this.databar = databar;
        this._lines.push(...d3.schemeBlues[3]);  // A
        this._lines.push(...d3.schemeGreens[3]); // G
    }
    // #endregion

    // #region [Public Methods]
    lineColor(i): string {
        return this._lines[i];
    }
    // #endregion
}