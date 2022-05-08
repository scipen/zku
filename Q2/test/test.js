const { expect } = require("chai");
const { ethers } = require("hardhat");
const fs = require("fs");
const { groth16, plonk } = require("snarkjs");

function unstringifyBigInts(o) {
    if ((typeof(o) == "string") && (/^[0-9]+$/.test(o) ))  {
        return BigInt(o);
    } else if ((typeof(o) == "string") && (/^0x[0-9a-fA-F]+$/.test(o) ))  {
        return BigInt(o);
    } else if (Array.isArray(o)) {
        return o.map(unstringifyBigInts);
    } else if (typeof o == "object") {
        if (o===null) return null;
        const res = {};
        const keys = Object.keys(o);
        keys.forEach( (k) => {
            res[k] = unstringifyBigInts(o[k]);
        });
        return res;
    } else {
        return o;
    }
}

describe("HelloWorld", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("HelloWorldVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing

        // generate a Groth16 proof from circuit inputs, the compiled circuit, and a zkey file
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2"}, "contracts/circuits/HelloWorld/HelloWorld_js/HelloWorld.wasm","contracts/circuits/HelloWorld/circuit_final.zkey");

        // print the output of 1*2 (what the circuit computes)
        console.log('1x2 =',publicSignals[0]);

        // convert stringified numbers to bigints
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);

        // create arguments for the solidity verifier contract
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        // convert the hex arguments to ints
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());

        // pack Groth16 proof parmeters
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        // extract circuit output
        const Input = argv.slice(8);

        // expect that proof is valid
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with Groth16", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("Multiplier3Verifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing

        // generate a Groth16 proof from circuit inputs, the compiled circuit, and a zkey file
        const { proof, publicSignals } = await groth16.fullProve({"a":"1","b":"2","c":"6"}, "contracts/circuits/Multiplier3/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3/circuit_final.zkey");

        // print the output of 1*2*6 (what the circuit computes)
        console.log('1x2x6 =',publicSignals[0]);
        
        // convert stringified numbers to bigints
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);

        // create arguments for the solidity verifier contract
        const calldata = await groth16.exportSolidityCallData(editedProof, editedPublicSignals);
    
        // convert the hex arguments to ints
        const argv = calldata.replace(/["[\]\s]/g, "").split(',').map(x => BigInt(x).toString());        

        // pack Groth16 proof parmeters
        const a = [argv[0], argv[1]];
        const b = [[argv[2], argv[3]], [argv[4], argv[5]]];
        const c = [argv[6], argv[7]];

        // extract circuit output
        const Input = argv.slice(8);

        // expect that proof is valid
        expect(await verifier.verifyProof(a, b, c, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = [0, 0];
        let b = [[0, 0], [0, 0]];
        let c = [0, 0];
        let d = [0]
        expect(await verifier.verifyProof(a, b, c, d)).to.be.false;
    });
});


describe("Multiplier3 with PLONK", function () {
    let Verifier;
    let verifier;

    beforeEach(async function () {
        Verifier = await ethers.getContractFactory("PlonkVerifier");
        verifier = await Verifier.deploy();
        await verifier.deployed();
    });

    it("Should return true for correct proof", async function () {
        //[assignment] Add comments to explain what each line is doing

        // generate a PLONK proof from circuit inputs, the compiled circuit, and a zkey file
        const { proof, publicSignals } = await plonk.fullProve({"a":"1","b":"2","c":"6"}, "contracts/circuits/Multiplier3_plonk/Multiplier3_js/Multiplier3.wasm","contracts/circuits/Multiplier3_plonk/circuit_final.zkey");

        // print the output of 1*2*6 (what the circuit computes)
        console.log('1x2x6 =',publicSignals[0]);

        // convert stringified numbers to bigints
        const editedPublicSignals = unstringifyBigInts(publicSignals);
        const editedProof = unstringifyBigInts(proof);

        // create arguments for the solidity verifier contract
        const calldata = await plonk.exportSolidityCallData(editedProof, editedPublicSignals);

        // extract PLONK proof parmeter
        const argv = calldata.split(',')   
        const a = argv[0];

        // extract circuit output and reformat
        const Input = [BigInt(argv[1].replace(/["[\]\s]/g, "")).toString()];

        // expect that proof is valid
        expect(await verifier.verifyProof(a, Input)).to.be.true;
    });
    it("Should return false for invalid proof", async function () {
        let a = '0x00';
        let b = ['0'];
        expect(await verifier.verifyProof(a, b)).to.be.false;
    });
});