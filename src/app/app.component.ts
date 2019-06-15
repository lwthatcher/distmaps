import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';

@Component({
  selector: 'dmap-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {
  // #region [Properties]
  title = 'distmaps';
  data_file = "/assets/pills-blue.short.csv";
  data: Promise<any>;
  // #endregion

    // #region [Constructors]
    constructor() { }

    ngOnInit() {
      this.data = d3.csv(this.data_file, this.parse_dims6);
      console.info('app init', this);
    }
    // #endregion

    // #region [Helper Methods]
    private parse_dims6 = (d) => {
      return [+d.Ax, +d.Ay, +d.Az, +d.Gx, +d.Gy, +d.Gz]
    }
    // #endregion
}
