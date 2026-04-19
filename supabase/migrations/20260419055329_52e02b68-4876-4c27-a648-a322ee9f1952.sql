-- Allow sandbox_exec role to update explanation columns for offline import
GRANT UPDATE ON public.math_questions TO sandbox_exec;
GRANT UPDATE ON public.math_test_questions TO sandbox_exec;
GRANT UPDATE ON public.practice_questions TO sandbox_exec;