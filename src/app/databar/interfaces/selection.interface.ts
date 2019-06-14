// #region [Selection Interface]
export interface Selection {
    select(selector: string): Selection
    selectAll(selector: string): Selection
    attr(attribute: string): any
    attr(attribue: string, value: any): Selection
    classed(attribute: string): Selection
    classed(attribue: string, value: any): Selection
    style(attribute: string, value: any): Selection
    append(element: string): Selection
    data(data: any): Selection
    data(data: any, key: any): Selection
    datum(data: any): Selection
    enter(): Selection
    exit(): Selection
    on(event: string): any
    on(event: string, callback): Selection
    on(event: string, callback, capture: boolean): Selection
    text(value): Selection
    call(value: any): Selection
    filter(filter: any): Selection
    merge(selection: Selection): Selection
    each(callback: any): Selection
    html(html: string): Selection
    transition(): SelectionTransition
    node(): any
    nodes(): any[]
    remove()
  }
  
  export interface SelectionTransition extends Selection {
    duration(length: number)
  }
  // #endregion