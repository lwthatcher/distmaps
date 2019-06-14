// #region [Time Format]
export function time_format(ms: number) {
    let secs = Math.floor(ms % (1000 * 60) / 1000);
    let mins = Math.floor(ms % (1000 * 60 * 60) / (1000 * 60));
    let hours = Math.floor(ms / (1000 * 60 * 60));
    let result = ""
    if (hours > 0) result += hours.toString() + ":" + mins.toString().padStart(2,'0');
    else result += mins.toString();
    result += ':' + secs.toString().padStart(2, '0');
    return result;
  }
  // #endregion
