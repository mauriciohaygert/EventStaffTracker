import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { getQueryFn, apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Loader2, PlusCircle, Pencil, Trash2 } from "lucide-react";
import { User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

// Schema para o formulário de criação/edição de usuários
const userFormSchema = z.object({
  username: z.string().min(3, "Nome de usuário deve ter pelo menos 3 caracteres"),
  email: z.string().email("Email inválido"),
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  role: z.enum(["user", "employee", "manager", "admin"], {
    required_error: "Selecione um nível de acesso",
  }),
  employeeId: z.string().optional().nullable().transform(val => val ? Number(val) : null),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  confirmPassword: z.string().optional(),
}).refine(data => !data.password || data.password === data.confirmPassword, {
  message: "As senhas não coincidem",
  path: ["confirmPassword"],
});

type UserFormValues = z.infer<typeof userFormSchema>;

export default function AdminUsers() {
  const { toast } = useToast();
  const { user: currentUser } = useAuth();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Consulta todos os usuários
  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Consulta funcionários para o select de vinculação
  const { data: employees } = useQuery({
    queryKey: ["/api/employees"],
    queryFn: getQueryFn({ on401: "throw" }),
  });

  // Mutação para criar usuário
  const createUserMutation = useMutation({
    mutationFn: async (userData: UserFormValues) => {
      const res = await apiRequest("POST", "/api/auth/register", userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário criado com sucesso",
        description: "O novo usuário foi adicionado ao sistema",
      });
      setIsDialogOpen(false);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para atualizar usuário
  const updateUserMutation = useMutation({
    mutationFn: async ({ id, userData }: { id: number; userData: Partial<UserFormValues> }) => {
      const res = await apiRequest("PATCH", `/api/users/${id}`, userData);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "Usuário atualizado com sucesso",
        description: "As informações do usuário foram atualizadas",
      });
      setIsDialogOpen(false);
      setSelectedUser(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar usuário",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Form de usuário
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: {
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
      employeeId: null,
      password: "",
      confirmPassword: "",
    },
  });

  // Manipuladores
  const handleAddUser = () => {
    setSelectedUser(null);
    form.reset({
      username: "",
      email: "",
      firstName: "",
      lastName: "",
      role: "user",
      employeeId: null,
      password: "",
      confirmPassword: "",
    });
    setIsDialogOpen(true);
  };

  const handleEditUser = (user: User) => {
    setSelectedUser(user);
    form.reset({
      username: user.username,
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      role: user.role as "user" | "employee" | "manager" | "admin",
      employeeId: user.employeeId,
      password: "",
      confirmPassword: "",
    });
    setIsDialogOpen(true);
  };

  const onSubmit = (values: UserFormValues) => {
    if (selectedUser) {
      // Se a senha estiver vazia, remova-a do objeto para não atualizar a senha
      if (!values.password) {
        const { password, confirmPassword, ...userData } = values;
        updateUserMutation.mutate({ id: selectedUser.id, userData });
      } else {
        updateUserMutation.mutate({ id: selectedUser.id, userData: values });
      }
    } else {
      createUserMutation.mutate(values);
    }
  };

  // Função para obter a cor do badge baseado no papel
  const getRoleBadgeVariant = (role: string) => {
    switch (role) {
      case "admin":
        return "destructive";
      case "manager":
        return "warning";
      case "employee":
        return "secondary";
      default:
        return "outline";
    }
  };

  // Renderiza o nome completo se disponível
  const getDisplayName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    return user.username;
  };

  // Tradução dos papéis
  const getRoleTranslation = (role: string) => {
    switch (role) {
      case "admin":
        return "Administrador";
      case "manager":
        return "Gerente";
      case "employee":
        return "Funcionário";
      default:
        return "Usuário";
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Gerenciamento de Usuários</h1>
        <Button onClick={handleAddUser} className="flex items-center">
          <PlusCircle className="h-4 w-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users?.map((user) => (
            <Card key={user.id} className="overflow-hidden hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg">{getDisplayName(user)}</CardTitle>
                    <p className="text-sm text-muted-foreground">{user.username}</p>
                  </div>
                  <Badge variant={getRoleBadgeVariant(user.role) as any}>
                    {getRoleTranslation(user.role)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p className="text-sm">
                    <span className="font-medium">Email:</span> {user.email}
                  </p>
                  {user.employeeId && (
                    <p className="text-sm">
                      <span className="font-medium">ID Funcionário:</span> {user.employeeId}
                    </p>
                  )}
                  <p className="text-sm">
                    <span className="font-medium">Último login:</span>{" "}
                    {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : "Nunca"}
                  </p>
                </div>

                <div className="flex justify-end mt-4 space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEditUser(user)}
                    disabled={currentUser?.id === user.id}
                  >
                    <Pencil className="h-4 w-4 mr-1" />
                    Editar
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Modal de criação/edição de usuário */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>
              {selectedUser ? "Editar Usuário" : "Adicionar Novo Usuário"}
            </DialogTitle>
            <DialogDescription>
              {selectedUser
                ? "Modifique os dados do usuário conforme necessário."
                : "Preencha o formulário para criar um novo usuário no sistema."}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome</FormLabel>
                      <FormControl>
                        <Input placeholder="Nome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sobrenome</FormLabel>
                      <FormControl>
                        <Input placeholder="Sobrenome" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="username"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome de usuário</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="Nome de usuário" 
                          {...field} 
                          disabled={!!selectedUser}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input 
                          placeholder="email@exemplo.com" 
                          type="email" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de acesso</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um nível" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="user">Usuário</SelectItem>
                          <SelectItem value="employee">Funcionário</SelectItem>
                          <SelectItem value="manager">Gerente</SelectItem>
                          <SelectItem value="admin">Administrador</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="employeeId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Vincular a funcionário</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value ? String(field.value) : ""}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione um funcionário" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="">Nenhum</SelectItem>
                          {employees?.map((employee) => (
                            <SelectItem key={employee.id} value={String(employee.id)}>
                              {employee.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        {selectedUser ? "Nova senha (opcional)" : "Senha"}
                      </FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder={selectedUser ? "Deixe em branco para não alterar" : "Senha"} 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmar senha</FormLabel>
                      <FormControl>
                        <Input 
                          type="password" 
                          placeholder="Confirme a senha" 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <DialogFooter className="pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button 
                  type="submit" 
                  disabled={createUserMutation.isPending || updateUserMutation.isPending}
                >
                  {(createUserMutation.isPending || updateUserMutation.isPending) ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {selectedUser ? "Atualizando..." : "Criando..."}
                    </>
                  ) : (
                    selectedUser ? "Atualizar" : "Criar"
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}