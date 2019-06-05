import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'dmap-databar',
  templateUrl: './databar.component.html',
  styleUrls: ['./databar.component.css']
})
export class DatabarComponent implements OnInit {

  // #region [Constructors]
  constructor() { }

  ngOnInit() {
    console.info('databar init', this);
  }
  // #endregion

  // #region [Callbacks]
  clicked(e) {
    console.log('you clicked me!', e);
  }
  // #endregion

}
