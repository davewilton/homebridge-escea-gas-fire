export const readBufferAsInt = (buffer, start, end)=>{
  return parseInt(buffer.slice(start, end).toString('hex'), 16);
};

export const readBufferAsBool = (buffer, start, end)=>{
  return readBufferAsInt(buffer, start, end) === 1;
};

export const readBufferAsStr = (buffer, start, end)=>{
  return buffer.slice(start, end).toString();
};

export const decimalToHexString = (number)=>{
  return number.toString(16).toUpperCase();
};
