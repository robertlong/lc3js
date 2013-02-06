describe("LC3", function() {

  beforeEach(function() {
    LC3.init();
  });

  it("Should initialize correctly", function(){
    expect(LC3.RAM).toEqual({});
    expect(LC3.Breakpoints).toEqual([]);
    expect(LC3.PC).toEqual(0x0000);
    expect(LC3.PSR).toEqual(0x0000);
    expect(LC3.IR).toEqual(0x0000);
    expect(LC3.Registers).toEqual([0x0000,0x0000,0x0000,0x0000,0x0000,0x0000,0x0000,0x0000]);
  });

  it("Should stop at breakpoints", function(){
    LC3.run(0x3000,{0x300F:1},{});
    expect(LC3.PC).toEqual(0x300F);
  });

});
