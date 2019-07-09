import { Component, OnInit } from '@angular/core';
import * as d3 from 'd3';
import { DataLoaderService } from './data-loader/data-loader.service';

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
    constructor(private dataloader: DataLoaderService) { }

    ngOnInit() {
      this.data = this.dataloader.load(this.data_file);
      console.info('app init', this);
    }
    // #endregion

    // #region [Helper Methods]
    private parse_dims6 = (d) => {
      return [+d.Ax, +d.Ay, +d.Az, +d.Gx, +d.Gy, +d.Gz]
    }
    // #endregion
}
