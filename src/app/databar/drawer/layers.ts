import {Selection} from '../interfaces/selection.interface';

// #region [Interfaces]
type ILayerMap = {[layer: string]: Layer}
// #endregion

// #region [Layer Class]
class Layer {
    name: string;
    selection: d3.Selection<any, any, any, any>;
    private sub: string = '*';
    private host: d3.Selection<any, any, any, any>;
    private selector: string;
    
    constructor(host: d3.Selection<any, any, any, any>, name: string, selector: string = null) {
        this.host = host;
        this.name = name;
        this.selector = selector || this.default_selector(name);
        this.selection = this.host.select(this.selector);
    }

    get all() { return this.selection.selectAll(this.sub) }

    get isPrimary() { return this.selector === this.default_selector(this.name) }

    subbed(subselector: string) { this.sub = subselector }

    private default_selector(name) { return 'g.transform > g.' + name }
}
// #endregion

export class LayerMap {
    // #region [Properties]
    host: d3.Selection<any, any, any, any>;
    private layers: ILayerMap = {}
    // #endregion

    // #region [Constructor]
    constructor(host: d3.Selection<any, any, any, any>) {
        this.host = host;
        this.addLayer('svg', 'div > svg')
        this.addLayer('transform', 'svg > g.transform')
        this.addLayer('energy')
        this.addLayer('signals')
        this.addLayer('axes')
        this.addLayer('x-axis', 'g.transform > g.axes').subbed('g.x-axis');
        this.addLayer('y-axis', 'g.transform > g.axes').subbed('g.y-axis');
        this.addLayer('labels')
        this.addLayer('handles')
        this.addLayer('ghost')
        this.addLayer('timebar')
        this.addLayer('cursor')
        this.addLayer('zoom', 'g.transform > rect.zoom')
        this.addLayer('clip', '#clip > rect.clip-rect')
    }
    // #endregion

    // #region [Public Methods]
    get(layer: string): Layer { return this.layers[layer] }
    // #endregion

    // #region [Accessors]
    get svg() { return this.layers['svg'].selection }

    get transform() { return this.layers['transform'].selection }

    get clip() { return this.layers['clip'].selection }

    get energy() { return this.layers['energy'].selection }

    get signals() { return this.layers['signals'].selection }

    get axes() { return this.layers['axes'].selection }

    get labels() { return this.layers['labels'].selection }

    get handles() { return this.layers['handles'].selection }

    get zoom() { return this.layers['zoom'].selection }

    get ghost() { return this.layers['ghost'].selection }
    
    get timebar() { return this.layers['timebar'].selection }

    get cursor() { return this.layers['cursor'].selection }

    get primaries(): Layer[] {
        let L = Object.values(this.layers)
        return L.filter((l) => l.isPrimary)
    }
    // #endregion

    // #region [Helper Methods]
    private addLayer(name, selector = null) {
        this.layers[name] = new Layer(this.host, name, selector);
        return this.layers[name];
    }
    // #endregion
}