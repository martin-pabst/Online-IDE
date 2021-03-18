type Stack = any[];

//int a = 0;
//b = 2*a;
//println(b);

// returns delta to next step
function step1(stack: Stack, stackFrame: number, interpreter: Interpreter):number {

    stack[aIndex + stackFrame] = 0;
    stack[bIndex + stackFrame] = 2*stack[aIndex + stackFrame];
    interpreter

}
