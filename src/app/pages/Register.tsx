import { useNavigate, Link } from 'react-router';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Award, Mail, Lock, User, Loader2, GraduationCap, IdCard } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { RadioGroup, RadioGroupItem } from '../components/ui/radio-group';
import { useStore } from '../../store/useStore';
import { mockEvent } from '../../lib/data';
import { toast } from 'sonner';
import { useState } from 'react';

const registerSchema = z.object({
  name: z.string().min(2, 'Họ và tên phải có ít nhất 2 ký tự'),
  email: z.string().email('Vui lòng nhập email hợp lệ'),
  password: z.string()
    .min(8, 'Mật khẩu phải có ít nhất 8 ký tự')
    .regex(/[A-Z]/, 'Mật khẩu phải chứa ít nhất một chữ hoa')
    .regex(/[0-9]/, 'Mật khẩu phải chứa ít nhất một số'),
  confirmPassword: z.string(),
  studentType: z.enum(['fpt', 'external'], {
    errorMap: () => ({ message: 'Vui lòng chọn loại sinh viên' }),
  }),
  studentId: z.string().min(1, 'Vui lòng nhập mã số sinh viên'),
  universityName: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Mật khẩu không khớp",
  path: ['confirmPassword'],
}).refine((data) => {
  if (data.studentType === 'external' && !data.universityName) {
    return false;
  }
  return true;
}, {
  message: "Vui lòng nhập tên trường",
  path: ['universityName'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

export function Register() {
  const navigate = useNavigate();
  const { setUser, setSelectedEvent } = useStore();
  const [studentType, setStudentType] = useState<'fpt' | 'external'>('fpt');

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      studentType: 'fpt',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500));

      toast.success('Đăng ký thành công!', {
        description: 'Tài khoản của bạn đang chờ Ban tổ chức phê duyệt. Bạn sẽ nhận được email thông báo khi được duyệt.',
      });

      navigate('/login');
    } catch (error) {
      toast.error('Đăng ký thất bại', {
        description: 'Vui lòng thử lại hoặc liên hệ Ban tổ chức.',
      });
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
                <Label htmlFor="name">Họ và tên</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Nguyễn Văn A"
                    className="pl-9"
                    {...register('name')}
                  />
                </div>
                {errors.name && (
                  <p className="text-sm text-red-600">{errors.name.message}</p>
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
                  defaultValue="fpt"
                  onValueChange={(value) => {
                    setStudentType(value as 'fpt' | 'external');
                    setValue('studentType', value as 'fpt' | 'external');
                  }}
                >
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="fpt" id="fpt" />
                    <Label htmlFor="fpt" className="cursor-pointer flex-1">
                      Sinh viên FPT
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2 p-3 border rounded-md hover:bg-gray-50 cursor-pointer">
                    <RadioGroupItem value="external" id="external" />
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
                  {studentType === 'fpt' ? 'Mã số sinh viên FPT' : 'Mã số sinh viên'}
                </Label>
                <div className="relative">
                  <IdCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    id="studentId"
                    type="text"
                    placeholder={studentType === 'fpt' ? 'SE123456' : 'Nhập mã số sinh viên'}
                    className="pl-9"
                    {...register('studentId')}
                  />
                </div>
                {errors.studentId && (
                  <p className="text-sm text-red-600">{errors.studentId.message}</p>
                )}
              </div>

              {studentType === 'external' && (
                <div className="space-y-2">
                  <Label htmlFor="universityName">Tên trường</Label>
                  <div className="relative">
                    <GraduationCap className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="universityName"
                      type="text"
                      placeholder="Đại học Bách Khoa, UIT, ..."
                      className="pl-9"
                      {...register('universityName')}
                    />
                  </div>
                  {errors.universityName && (
                    <p className="text-sm text-red-600">{errors.universityName.message}</p>
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
