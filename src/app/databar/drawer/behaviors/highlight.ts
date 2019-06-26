import { Drawer } from "../drawer";
import * as d3 from "d3";
import { Selection } from "../../interfaces/selection.interface";


export class HighlightBehavior {
    // #region [Constructor]
    drawer: Drawer;
    div: d3.Selection<any,any,any,any>;
    constructor(drawer: Drawer) {
        this.drawer = drawer;
        this.div = d3.select('body')
                     .append('div')
                     .attr('class', 'tooltip')
                     .style('opacity', 0);
    }
    // #endregion

    // #region [Public Methods]
    mouseover(j) {
        this.highlight_signal(j);
        this.display_tooltip(j);
      }
    
      mouseout() {
        this.drawer.signals.classed('line--hover', false)
                           .classed('line--fade', false);
        this.div.transition()
                .duration(500)
                .style('opacity', 0);
      }
    // #endregion

    // #region [Helper Methods]
    private highlight_signal(j) {
        this.drawer.signals.each((d,i,nodes) => {
            let self = d3.select(nodes[i]);
            let idx = self.attr('idx');
            self.classed('line--hover', () => idx == j);
            self.classed('line--fade', () => idx != j);
        })
    }
    
    private display_tooltip(j) {
        this.div.transition()
                .duration(200)
                .style("opacity", 1);

        // #TODO: sensor -> tooltip display text
        this.div.html(j)
                .style("left", (d3.event.pageX - 55) + "px")
                .style("top", (d3.event.pageY - 40) + "px");
    }
    // #endregion
}