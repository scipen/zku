pragma circom 2.0.0;

include "../../node_modules/circomlib/circuits/comparators.circom";
include "../../node_modules/circomlib-matrix/circuits/matMul.circom";
// include ""; // hint: you can use more than one templates in circomlib-matrix to help you

template SystemOfEquations(n) { // n is the number of variables in the system of equations
    signal input x[n]; // this is the solution to the system of equations
    signal input A[n][n]; // this is the coefficient matrix
    signal input b[n]; // this are the constants in the system of equations
    signal output out; // 1 for correct solution, 0 for incorrect solution

    // [bonus] insert your code here

    // compute Ax
    component mul = matMul(n,n,1);
    for (var i=0; i<n; i++) {
        for (var j=0; j<n; j++) {
            mul.a[i][j] <== A[i][j];
        }
        mul.b[i][0] <== x[i];
    }

    // check if each Ax_i === b_i
    component isValid[n];
    for (var i=0; i<n; i++) {
        isValid[i] = IsEqual();
        isValid[i].in[0] <== mul.out[i][0];
        isValid[i].in[1] <== b[i];
    }

    // number of valid rows should equal n
    var validCt = 0;
    for (var i=0; i<n; i++) {
        validCt += isValid[i].out;
    }

    component ok = IsEqual();
    ok.in[0] <== n;
    ok.in[1] <== validCt;
    out <== ok.out;
}

component main {public [A, b]} = SystemOfEquations(3);