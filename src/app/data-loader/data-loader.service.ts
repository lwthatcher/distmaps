import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import * as d3 from 'd3';

@Injectable({
  providedIn: 'root'
})
export class DataLoaderService {
  // #region [Constructor]
  constructor(private http: HttpClient) { }
  // #endregion

  // #region [Public Methods]
  load(path: string) {
    let uri = path;  // TODO: hook-up to tcm API instead of assets
    return d3.csv(uri, this.parse_dims6);
  }

  loadGradient(path: string) {
    // @ts-ignore
    return d3.csv(path, (d) => +d.dist);
  }
  // #endregion

  // #region [Helper Methods]
  private parse_dims6 = (d) => {
    return [+d.Ax, +d.Ay, +d.Az, +d.Gx, +d.Gy, +d.Gz]
  }
  // #endregion
}
