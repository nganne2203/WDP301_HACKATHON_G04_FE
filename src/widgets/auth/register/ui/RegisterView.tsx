import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Mail, Lock, User, Loader2, GraduationCap, IdCard } from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/shared/ui/card';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { RadioGroup, RadioGroupItem } from '@/shared/ui/radio-group';
import { authApi } from '@/shared/api/auth';
import { ApiError } from '@/shared/api/client';
import { toast } from 'sonner';
import { useState } from 'react';

const registerSchema = z.object({
  fullName: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự').max(120),
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .max(128),
  confirmPassword: z.string(),
  studentType: z.enum(['FPT', 'EXTERNAL'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại sinh viên' }),
  }),
  studentId: z.string().min(2, 'Vui lòng nhập mã số sinh viên').max(50),
  schoolName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.studentType === 'EXTERNAL' && !data.schoolName) {
    return false;
  }
  return true;
}, {
  message: "Vui lòng nhập tên trường",
  path: ['schoolName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const [studentType, setStudentType] = useState<'FPT' | 'EXTERNAL'>('FPT');

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
        studentType: data.studentType,
        studentId: data.studentId,
        schoolName: data.studentType === 'EXTERNAL' ? data.schoolName : undefined,
      });

      toast.success('Đăng ký thành công!', {
        description: 'Tài khoản của bạn đang chờ Ban tổ chức phê duyệt. Bạn sẽ nhận được email thông báo khi được duyệt.',
      });

      navigate('/login');
    } catch (error) {
      if (error instanceof ApiError) {
        if (error.code === 'CONFLICT') {
          setError('email', { message: 'Email đã được sử dụng' });
        } else if (error.code === 'VALIDATION_ERROR') {
          const errorDetails = error.errors;
          errorDetails.forEach((err) => {
            toast.error('Lỗi xác thực', { description: err });
          });
        } else {
          toast.error('Đăng ký thất bại', { description: error.firstError });
        }
      } else {
        toast.error('Đăng ký thất bại', {
          description: 'Không thể kết nối đến server. Vui lòng thử lại.',
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center mb-4 shadow-lg">
            <Award className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">Đăng ký SEAL</h1>
          <p className="text-gray-600 text-center mt-2">
            Tạo tài khoản để tham gia Hackathon
          </p>
        </div>

        <Card className="shadow-xl border-gray-200">
          <CardHeader className="space-y-1">
            <CardTitle className="text-2xl">Tạo tài khoản</CardTitle>
            <CardDescription>
              Điền thông tin để đăng ký tham gia Hackathon
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="fullName"
                    type="text"
                    placeholder="Nguyễn Văn A"
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

              <div className="space-y-3">
                <Label>Loại sinh viên</Label>
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
                      Sinh viên FPT
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="EXTERNAL" id="external" />
                    <Label htmlFor="external" className="cursor-pointer flex-1">
                      Sinh viên ngoài trường
                    </Label>
                  </div>
                </RadioGroup>
                {errors.studentType && (
                  <p className="text-sm text-red-600">{errors.studentType.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">
                  {studentType === 'FPT' ? 'Mã số sinh viên FPT' : 'Mã số sinh viên'}
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder={studentType === 'FPT' ? 'SE123456' : 'Nhập mã số sinh viên'}
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
                  <Label htmlFor="schoolName">Tên trường</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="schoolName"
                      type="text"
                      placeholder="Đại học Bách Khoa, UIT, ..."
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
                <Label htmlFor="password">Mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="Tạo mật khẩu mạnh"
                    className="pl-9"
                    {...register('password')}
                  />
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    className="pl-9"
                    {...register('confirmPassword')}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-sm text-red-600">{errors.confirmPassword.message}</p>
                )}
              </div>

              <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-800">
                  <strong>Lưu ý:</strong> Tài khoản của bạn cần được Ban tổ chức phê duyệt trước khi có thể tham gia Hackathon.
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
                    Đang đăng ký...
                  </>
                ) : (
                  'Đăng ký'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <span className="text-gray-600">Đã có tài khoản? </span>
              <Link to="/login" className="text-blue-600 hover:text-blue-700 font-medium">
                Đăng nhập
              </Link>
            </div>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-gray-500 mt-6">
          Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản Dịch vụ và Chính sách Bảo mật của SEAL
        </p>
      </div>
    </div>
  );
}
