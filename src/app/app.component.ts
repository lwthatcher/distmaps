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
  dist_file = "/assets/pills-blue.short.logl2.csv";
  data: Promise<any>;
  dmap: Promise<any>;
  // #endregion

    // #region [Constructors]
    constructor(private dataloader: DataLoaderService) { }

    ngOnInit() {
      this.data = this.dataloader.load(this.data_file);
      this.dmap = this.dataloader.loadGradient(this.dist_file);
      console.info('app init', this);
    }
    // #endregion
}
