import { Component, OnInit, ElementRef, Output, EventEmitter, Input } from '@angular/core';
import { datum } from './interfaces/data.interface';
import { LabelStream } from './labeller/labelstream';
import { Labeller } from './labeller/labeller';
import { ModeTracker } from './modes/tool-mode';
import { Drawer } from './drawer/drawer';
import { Colorer } from './colorer/colorer';

@Component({
  selector: 'dmap-databar',
  templateUrl: './databar.component.html',
  styleUrls: ['./databar.component.css']
})
export class DatabarComponent implements OnInit {

  //# region [Inputs]
  @Input() data;
  // #endregion

  // #region [Outputs]
  @Output() zoom = new EventEmitter<any>();
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
  labelstream: LabelStream;
  get labels() { return this.labelstream && this.labelstream.labels || [] }
  get selected_label() { return this.labels && this.labels.find((lbl) => lbl.selected) || false }
  // Trackers
  mode: ModeTracker;
  // Helpers
  labeller: Labeller;
  drawer: Drawer;
  colorer: Colorer;
  // stubs
  get has_energy() { return false }
  get x() { return this.drawer.x }
  get x0() { return this.drawer.x0 }
  // #endregion

  // #region [Constructors]
  constructor(private el: ElementRef) { }

  ngOnInit() {
    // selectors
    this.container = this.el.nativeElement.parentElement;
    console.log('containers', this.el.nativeElement, this.container);
    // setup trackers
    this.mode = new ModeTracker();
    // setup helpers
    this.colorer = new Colorer(this);
    this.drawer = new Drawer(this);
    this.labeller = new Labeller(this);
    // draw
    this.drawer.draw();
    // log
    console.info('databar init', this);
  }
  // #endregion

  // #region [Public Methods]
  downsample(data) {
    // #TODO: downsample
    return data;
  }
  // #endregion
}
