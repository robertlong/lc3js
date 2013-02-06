var LC3 = {
  RAM: {
    0x3000: 0x0123,
    0x3001: 0x1111,
    0x3002: 0x2222
  },
  PC: 0x0000,
  Registers: [0x0000,0x0000,0x0000,0x0000,0x0000,0x0000,0x0000,0x0000],
  PSR:0x0000,
  IR:0x0000,
  Breakpoints: [],
  run: function(PC,Breakpoints){

    this.PC = PC;
    this.Breakpoints = Breakpoints;

    while(this.Breakpoints[this.PC] == null && this.PC < 0x4000){
      this.IR = this.RAM[this.PC];
      this.PC++;
      this.execute();
    }
  },
  execute: function(){
    var opcode = (this.IR & 0xF000) >> 12;
    switch(opcode){
      case 0x0:
        this.BR();
        break;
      case 0x1:
        this.ADD();
        break;
      case 0x2:
        this.LD();
        break;
      case 0x3:
        this.ST();
        break;
      case 0x4:
        this.JSR();
        break;
      case 0x5:
        this.AND();
        break;
      case 0x6:
        this.LDR();
        break;
      case 0x7:
        this.STR();
        break;
      case 0x8:
        this.RTI();
        break;
      case 0x9:
        this.NOT();
        break;
      case 0xA:
        this.LDI();
        break;
      case 0xB:
        this.STI();
        break;
      case 0xC:
        this.RET();
        break;
      case 0xD:
        //RESERVED
        break;
      case 0xE:
        this.LEA();
        break;
      case 0xF:
        this.TRAP();
        break;
      default:
        throw new this.InvalidInstructionException(opcode + " is not a valid OP Code.", this);
    }
  },
  BR: function(){
    // Get the condition codes from the PSR and compare with those from the IR
    if((this.PSR & 0x0009) == (this.IR & 0x0E00)){
      //Increment the PC by the offset found in bits 0:8
      this.PC += this.SEXT(this.IR,9);
    }
  },

  ADD: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var SR1 = (this.IR & 0x0700) >> 6;
    if((0x0020 & this.IR)){
      this.Registers[DR] = SR1 + this.SEXT(this.IR,5);
    }else{
      var SR2 = (this.IR & 0x0007);
      this.Registers[DR] = this.Registers[SR1] + this.Registers[SR2];
    }
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  LD: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var offset = this.SEXT(this.IR,9);
    this.Registers[DR] = this.RAM[this.PC + offset];
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  ST: function(){
    var SR = (this.IR & 0x0F00) >> 9;
    var offset = this.SEXT(this.IR,9);
    this.RAM[this.PC + offset] = this.Registers[SR];
  },

  JSR: function(){
    this.Registers[7] = this.PC;
    if((this.IR & 0x0800)){
      this.PC += this.SEXT(this.IR,11);
    }else{
      this.PC = (this.IR & 0x01C0) >> 6;
    }
  },

  AND: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var SR1 = (this.IR & 0x0700) >> 6;
    if((this.IR & 0x0020)){
      this.Registers[DR] = this.Registers[SR1] & this.SEXT(this.IR,5);
    }else{
      var SR2 = (this.IR & 0x0007);
      this.Registers[DR] = this.Registers[SR1] & this.Registers[SR2];
    }
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  LDR: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var BaseR = (this.IR & 0x01C0) >> 6;
    var offset = this.SEXT(this.IR,6);
    this.Registers[DR] = this.RAM[this.Registers[BaseR] + offset];
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  STR: function(){
    var SR = (this.IR & 0x0F00) >> 9;
    var BaseR = (this.IR & 0x01C0) >> 6;
    var offset = this.SEXT(this.IR,6);
    this.RAM[this.Registers[BaseR] + offset] = this.Registers[SR];
  },

  RTI: function(){
    //Todo supervisor mode function
  },

  NOT: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var SR = (this.IR & 0x0700) >> 6;
    this.Registers[DR] = ~this.Registers[SR];
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  LDI: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var offset = this.SEXT(this.IR,9);
    this.Registers[DR] = this.RAM[this.RAM[this.PC + offset]];
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  STI: function(){
    var SR = (this.IR & 0x0F00) >> 9;
    var offset = this.SEXT(this.IR,9);
    this.RAM[this.RAM[this.PC + offset]] = this.Registers[SR];
  },

  RET: function(){
    this.PC = this.Registers[7];
  },

  LEA: function(){
    var DR = (this.IR & 0x0F00) >> 9;
    var offset = this.SEXT(this.IR,9);
    this.Registers[DR] = this.PC + offset;
    this.setcc(this.SEXT(this.Registers[DR],16));
  },

  TRAP: function(){
    this.Registers[7] = this.PC;
    this.PC = this.RAM[this.IR & 0x00FF];
  },

  setcc: function(value){
    if(value < 0){
      this.PSR = (this.PSR & 0xFFF0) + 0x0004;
    }else if(value > 0){
      this.PSR = (this.PSR & 0xFFF0) + 0x0001;
    }else{
      this.PSR = (this.PSR & 0xFFF0) + 0x0002;
    }
  },

  SEXT: function(bin,length){
    var temp = bin & (Math.pow(2,length) - 1);
    if(temp < Math.pow(2,length)/2){
      return temp;
    }else{
      return ~temp + 1;
    }
  },

  InvalidInstructionException: function (message) {
    this.message = message;
    this.machine_state = this;
    this.address = this.PC.toString(16);
    this.name = "InvalidInstructionException";
  }
};