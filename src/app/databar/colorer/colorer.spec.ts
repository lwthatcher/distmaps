import { Colorer } from './colorer';


// Straight Jasmine testing without Angular's testing support
describe('Colorer', () => {
    
    beforeEach(() => { });
   
    it('lines -- 6 dims by default', () => {
        let c = new Colorer(null);
        expect(c._lines.length).toBe(6);
    });

});