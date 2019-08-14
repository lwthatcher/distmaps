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
  _dist1 = "/assets/pb.ld.csv";
  _dist2 = "/assets/pills-blue.short.logl2.csv";
  _dist3 = "/assets/pills-blue.short.l1.csv";
  data: Promise<any>;
  dmap1: Promise<any>;
  dmap2: Promise<any>;
  dmap3: Promise<any>;
  // #endregion

    // #region [Constructors]
    constructor(private dataloader: DataLoaderService) { }

    ngOnInit() {
      this.data = this.dataloader.load(this.data_file);
      this.dmap1 = this.dataloader.loadGradient(this._dist1);
      this.dmap2 = this.dataloader.loadGradient(this._dist2);
      this.dmap3 = this.dataloader.loadGradient(this._dist3);
      console.info('app init', this);
    }
    // #endregion
}
