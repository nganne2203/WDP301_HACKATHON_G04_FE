import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Eye, EyeOff, Github, GraduationCap, IdCard, Loader2, Lock, Mail, User } from 'lucide-react';
import { toast } from 'sonner';

import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Full name must be at least 2 characters').max(120),
  email: z.string().email('Please enter a valid email address'),
  githubUsername: z.string().trim()
    .min(1, 'Please enter a GitHub username')
    .max(39, 'GitHub username must not exceed 39 characters')
    .regex(/^[A-Za-z0-9](?:[A-Za-z0-9-]*[A-Za-z0-9])?$/, 'GitHub username is invalid. Use only letters, numbers, and hyphens.'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128),
  confirmPassword: z.string(),
  studentType: z.enum(['FPT', 'EXTERNAL'], {
    errorMap: () => ({ message: 'Please select a student type' }),
  }),
  studentId: z.string().min(2, 'Please enter a student ID').max(50),
  schoolName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.studentType === 'EXTERNAL' && !data.schoolName) {
    return false;
  }
  return true;
}, {
  message: 'Please enter your school name',
  path: ['schoolName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [studentType, setStudentType] = useState<'FPT' | 'EXTERNAL'>('FPT');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
    setError,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentType: 'FPT',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await authApi.register({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        githubUsername: data.githubUsername,
        studentType: data.studentType,
        studentId: data.studentId,
        schoolName: data.studentType === 'EXTERNAL' ? data.schoolName : undefined,
      });

      toast.success('Registration submitted', {
        description: 'Your account is waiting for coordinator approval. You will receive an email notification once it is approved.',
      });

      navigate('/login');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'CONFLICT') {
          setError('email', { message: 'This email is already in use' });
        } else if (error.code === 'VALIDATION_ERROR') {
          const errorDetails = error.errors;
          errorDetails.forEach((err) => {
            toast.error('Validation error', { description: err });
          });
        } else {
          toast.error('Registration failed', { description: error.firstError });
        }
      } else {
        toast.error('Registration failed', {
          description: 'Could not connect to the server. Please try again.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="mb-5 flex h-24 w-24 items-center justify-center rounded-[1.6rem] bg-black shadow-[0_18px_38px_rgba(0,0,0,0.24)]">
            <img
              src="/assets/Logo1.png"
              alt="SEAL logo"
              className="h-[4.5rem] w-[4.5rem] scale-150 object-contain"
            />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Register for SEAL</h1>
          <p className="text-gray-600 text-center mt-2">
            Create an account to join the hackathon
          </p>
        </div>

        <Card className="shadow-xl border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Create account</CardTitle>
            <CardDescription>
              Fill in your information to register for the hackathon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyen Van A"
                    className="pl-9"
                    {...register('fullName')}
                  />
                </div>
                {errors.fullName && (
                  <p className="text-sm text-red-600">{errors.fullName.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="email@example.com"
                    className="pl-9"
                    {...register('email')}
                  />
                </div>
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="githubUsername">GitHub Username</Label>
                <div className="relative">
                  <Github className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="githubUsername"
                    type="text"
                    placeholder="GitHub username"
                    className="pl-9"
                    {...register('githubUsername')}
                  />
                </div>
                {errors.githubUsername && (
                  <p className="text-sm text-red-600">{errors.githubUsername.message}</p>
                )}
              </div>

              <div className="space-y-3">
                <Label>Student type</Label>
                <RadioGroup
                  defaultValue="FPT"
                  onValueChange={(value) => {
                    setStudentType(value as 'FPT' | 'EXTERNAL');
                    setValue('studentType', value as 'FPT' | 'EXTERNAL');
                  }}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="FPT" id="fpt" />
                    <Label htmlFor="fpt" className="cursor-pointer flex-1">
                      FPT student
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="EXTERNAL" id="external" />
                    <Label htmlFor="external" className="cursor-pointer flex-1">
                      External student
                    </Label>
                  </div>
                </RadioGroup>
                {errors.studentType && (
                  <p className="text-sm text-red-600">{errors.studentType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">
                  {studentType === 'FPT' ? 'FPT student ID' : 'Student ID'}
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder={studentType === 'FPT' ? 'SE123456' : 'Enter your student ID'}
                    className="pl-9"
                    {...register('studentId')}
                  />
                </div>
                {errors.studentId && (
                  <p className="text-sm text-red-600">{errors.studentId.message}</p>
                )}
              </div>

              {studentType === 'EXTERNAL' && (
                <div className="space-y-2">
                  <Label htmlFor="schoolName">School name</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="University name"
                      className="pl-9"
                      {...register('schoolName')}
                    />
                  </div>
                  {errors.schoolName && (
                    <p className="text-sm text-red-600">{errors.schoolName.message}</p>
                  )}
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Create a strong password"
                    className="pl-9 pr-10"
                    {...register('password')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    placeholder="Re-enter your password"
                    className="pl-9 pr-10"
                    {...register('confirmPassword')}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-3 text-gray-400 hover:text-gray-600 focus:outline-none"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Your account must be approved by the coordinator before you can join the hackathon.
                </p>
              </div>

              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                size="lg"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Registering...
                  </>
                ) : (
                  'Register'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Already have an account? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Sign in
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          By creating an account, you agree to SEAL's Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  );
}
