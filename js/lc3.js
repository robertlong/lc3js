var LC3 = {
  RAM: {
    0x3000: 0x0123,
    0x3001: 0x1111,
    0x3002: 0x2222
  },
  PC: 0,
  Registers: [0,0,0,0,0,0,0,0],
  PSR:0,
  IR:0,
  Conditions:{N:0,
              Z:0,
              P:0,
              Priv:0},
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
      this.Registers[DR] = SR1 + SR2;
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