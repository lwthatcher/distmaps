import { Component, OnInit, ElementRef } from '@angular/core';
import { datum } from './interfaces/data.interface';
import { LabelStream } from './labeller/labelstream';
import { Labeller } from './labeller/labeller';
import { ModeTracker } from './modes/tool-mode';
import { Drawer } from './drawer/drawer';

@Component({
  selector: 'dmap-databar',
  templateUrl: './databar.component.html',
  styleUrls: ['./databar.component.css']
})
export class DatabarComponent implements OnInit {

  // #region [Constructors]
  constructor(private el: ElementRef) { }

  ngOnInit() {
    console.info('databar init', this);
  }
  // #endregion

  // #region [Properties]
  //data
  _data: Promise<datum[][]>;
  // container/element
  container: Element;
  get element() { return this.el }
  // margins/width/height
  margin = {top: 4, right: 50, bottom: 20, left: 50}
  _height: number = 200;
  get WIDTH() { return this.container.clientWidth; }
  get HEIGHT() { return this._height; }
  get width() { return this.WIDTH - this.margin.left - this.margin.right; }
  get height() { return this.HEIGHT - this.margin.top - this.margin.bottom; }
  // labels
  labeller: Labeller;
  labelstream: LabelStream;
  get labels() { return this.labelstream && this.labelstream.labels || [] }
  get selected_label() { return this.labels && this.labels.find((lbl) => lbl.selected) || false }
  // modes
  mode: ModeTracker;
  // stubs
  get has_energy() { return false }
  drawer: Drawer;
  get x() { return this.drawer.x }
  get x0() { return this.drawer.x0 }
  // #endregion

  // #region [Callbacks]
  clicked(e) {
    console.log('you clicked me!', e);
  }
  // #endregion

  // #region [Public Methods]
  downsample(data) {
    // #TODO: downsample
    return data;
  }
  // #endregion
}
