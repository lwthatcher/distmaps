import { Drawer } from "../drawer";
import * as d3 from "d3";
import d3ForceSurface from 'd3-force-surface';
import { Label } from "../../../labelstreams/labelstream";

// # region [Interfaces]
interface Point { x: number; y: number; }

interface Surface { from: Point; to: Point; }
// #endregion

export class PourBehavior {
    // #region [Constants]
    ALPHA_DECAY = 0.000;
    PARTICLE_RADIUS = 2;
    COLLIDE_RADIUS = 5;
    DX = 10;
    TICK = 100;
    PPT = 2;
    ADD_RATE = 5;
    // #endregion
    
    // #region [Properties]
    drawer: Drawer;
    particles;
    simulation;
    boundaries: Surface[];
    private current_lbl;
    private ti = 0;
    private x_twiddle;
    // #endregion

    // #region [Constructor]
    constructor(drawer: Drawer) {
        this.drawer = drawer;
        this.particles = [];
        this.boundaries = [
            {from: {x:0, y:0}, to: {x:0, y:this.h}},
            {from: {x:0, y:this.h}, to: {x:this.w, y:this.h}},
            {from: {x:this.w, y:this.h}, to: {x:this.w, y:0}},
            {from: {x:this.w, y:0}, to: {x:0, y:0}}
        ]
    }
    // #endregion

    // #region [Accessors]
    get energy() { return this.drawer.energy }
    
    get label_type() { return this.drawer.label_type}

    get x() { return this.drawer.x }

    get y() { return this.drawer.ys }

    get w() { return this.drawer.w }

    get h() { return this.drawer.h }

    get color() { return this.drawer.databar.colorer.labels(this.drawer.ls.name).get(this.label_type)}

    get pouring() { return !!this.current_lbl || !!this.simulation }
    // #endregion

    // #region [Callbacks]
    get xi() { return (x) => this.x.invert(x); }

    yDepth(formatted) {
        let e = (x) => {return this.energy.at(this.xi(x), formatted)}
        return (x) => { return this.drawer.ys(e(x)) }
    }

    roll(ys) {
        return (x) => {
            let x0 = ys(x);
            let x1 = ys(x+this.DX);
            let x2 = ys(x-this.DX);
            let left = (x0-x2)/(this.DX*2)
            let right = (x0-x1)/(this.DX*2)
            return x+left-right;
        }
    }
    // #endregion

    // #region [Public Methods]
    async start() {
        if (!this.energy.has_energy) return;
        if (this.simulation) {
            console.warn('simulation already in progress', this.simulation);
            this.end();
            return;
        }
        console.debug('start pour!');
        let [x,y] = this.drawer.xy();
        this.x_twiddle = d3.randomNormal(x);
        let formatted = await this.energy.formatted;
        let ys = this.yDepth(formatted);
        let roll = this.roll(ys);
        let lblWalls = this.labelWalls(this.drawer.labels);
        this.current_lbl = this.drawer.labeller.add(x, this.label_type, 1);
        this.simulation = this.createSimulation(ys, roll, lblWalls);
    }
    
    end() {
        if (this.simulation) {
            this.simulation.stop();
            this.simulation.on('tick', null);
        }
        this.clearParticles();
        this.current_lbl = undefined;
        this.simulation = undefined;
        this.particles = [];
    }
    // #endregion
    
    // #region [Helper Methods]
    private ticked() {
        // add particles
        if (this.ti % this.ADD_RATE === 0) this.addParticles();
        // stop if error
        if (this.particles.length === 0) {
            console.warn('No particles!');
            return;
        }
        // update particle positions
        let u = this.drawer.layers.ghost.selectAll('circle').data(this.particles);
        u.enter()
            .append('circle')
            .attr('r', this.PARTICLE_RADIUS)
            .attr('fill', this.color)
            .attr('opacity', .9)
            .merge(u)
            .attr('cx', (d) => d.x)
            .attr('cy', (d) => d.y);
        // extend label
        let [start, end] = this.extents();
        this.current_lbl = this.drawer.labeller.grow(this.current_lbl, start, end);
        // increment
        this.ti += 1;
    }

    private addParticles() {
        let points = []
        let x = this.x_twiddle;
        for (let i = 0; i < this.PPT; i++) 
            points.push({x: x(), y: 1});
        this.particles.push(...points);
        this.simulation.nodes(this.particles);
        this.simulation.restart();
    }

    private clearParticles() {
        this.drawer.layers.ghost
            .selectAll('circle')
            .transition()
            .duration(750)
            .attr('opacity', 0)
            .remove();
    }

    private createSimulation(ys, roll, walls) {
        this.ti = 0;
        if (this.simulation) this.simulation.stop();
        return d3.forceSimulation(this.particles)
                 .force('collide', d3.forceCollide(this.COLLIDE_RADIUS))
                 .force('boundaries', this.container(this.boundaries))
                 .force('labels', this.container(walls))
                 .force('fall', d3.forceY((d) => {return ys(d.x) }))
                 .force('roll', d3.forceX((d) => {return roll(d.x) }))
                 .alphaDecay(this.ALPHA_DECAY)
                 .on('tick', () => this.ticked());
    }

    private container(surfaces) { 
        return d3ForceSurface()
                .surfaces(surfaces)
                .oneWay(true)
                .radius(this.PARTICLE_RADIUS)
                .onImpact((node, surface) => this.impact(node, surface))
    }

    private labelWalls(labels: Label[]): Surface[] {
        let result = []
        for (let l of labels) {
            let [xl, xr] = [this.x(l.start), this.x(l.end)]
            result.push({from: {x: xl, y: this.h}, to: {x: xl, y: 0}}); // left
            result.push({from: {x: xr, y: 0}, to: {x: xr, y: this.h}}); // right
        }
        return result;
    }

    private impact(_, surface) {
        if (this.isVertical(surface)) {
            if (this.isLeft(surface)) this.current_lbl.end = this.x.invert(surface.to.x);
            else this.current_lbl.start = this.x.invert(surface.to.x);
        }
    }

    private extents() { return d3.extent(this.particles, (d) => d.x) }

    private isVertical(s: Surface) { return s.from.x === s.to.x }

    private isLeft(s: Surface) { return s.from.y > s.to.y }
    // #endregion
}