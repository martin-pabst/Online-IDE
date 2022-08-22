# `a = b * c;`
  * Fragment `stack[stackbase+loc_a]`, lastPartIsJsExpression == true
  * Fragment `stack[stackbase+loc_b]`, lastPartIsJsExpression == true
  * Fragment `stack[stackbase+loc_c]`, lastPartIsJsExpression == true
  * `stack[stackbase+loc_b] * stack[stackbase+loc_c]`, lastPartIsJsExpression == true
  * `stack[stackbase+loc_a] = stack[stackbase+loc_b] * stack[stackbase+loc_c]`, lastPartIsJsExpression == true

# `a = b * c.myfunc(d, e);`
  * 1:Fragment `stack[stackbase+loc_a]`, lastPartIsJsExpression == true
  * 2:Fragment `stack[stackbase+loc_b]`, lastPartIsJsExpression == false
  * 3:Fragment `stack[stackbase+loc_c]`, lastPartIsJsExpression == true
  * 4:Fragment `stack[stackbase+loc_d]`, lastPartIsJsExpression == true
  * 5:Fragment `stack[stackbase+loc_e]`, lastPartIsJsExpression == true
  * compilation of function call => push fragments 3, 4, 5
  * -> `thread.callP