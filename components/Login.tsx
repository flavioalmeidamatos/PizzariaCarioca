import React, { useState, useRef } from 'react';
import { User, Users, Lock, Eye, EyeOff, Fingerprint, LogIn, Mail, Camera, UserPlus, ArrowLeft, Phone, ChevronDown } from 'lucide-react';
import { LOGO_URL } from '../types';
import { supabase } from '../lib/supabase';

interface LoginProps {
  onLogin: () => void;
}

// Strict RFC 5322 Regex
const EMAIL_REGEX = new RegExp(/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/);

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Form States
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [telefone, setTelefone] = useState('');
  const [role, setRole] = useState<'admin' | 'staff'>('staff');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [emailError, setEmailError] = useState('');

  // Avatar States
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const roleSelectRef = useRef<HTMLSelectElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Final Validation before submit
    if (!EMAIL_REGEX.test(email)) {
      setEmailError('E-mail inválido');
      return;
    }

    if (!password.trim()) {
      return;
    }

    if (isRegistering && password !== confirmPassword) {
      alert("As senhas não coincidem");
      return;
    }

    setIsLoading(true);

    try {
      if (isRegistering) {
        // Sign up with metadata for the DB Trigger
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              nome_completo: name,
              telefone: telefone,
              role: role,
              avatar_url: '', // Will update after upload
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          // If we have an avatar, upload it and update the profile
          if (avatarFile) {
            const fileExt = avatarFile.name.split('.').pop();
            const fileName = `${authData.user.id}.${fileExt}`;
            const { error: uploadError } = await supabase.storage
              .from('avatars')
              .upload(fileName, avatarFile);

            if (uploadError) {
              console.error('Erro ao enviar avatar:', uploadError);
            } else {
              const { data: publicUrlData } = supabase.storage
                .from('avatars')
                .getPublicUrl(fileName);

              // Manual update for avatar_url
              await supabase
                .from('perfis')
                .update({ avatar_url: publicUrlData.publicUrl })
                .eq('id', authData.user.id);
            }
          }

          alert('Conta criada com sucesso! Verifique seu e-mail (se necessário) e faça login.');
          setIsRegistering(false);
        }
      } else {
        // Sign in
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;
        onLogin();
      }
    } catch (error: any) {
      alert(error.message || 'Erro ao processar solicitação');
    } finally {
      setIsLoading(false);
    }
  };

  // Strict Policy: Traps focus if field is empty or email is invalid
  const handleStrictBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const value = e.target.value.trim();
    const fieldName = e.target.name;

    // Don't allow empty fields
    if (!value) {
      e.target.focus();
      return;
    }

    // Specifically for email fields, validate format
    if (fieldName.includes('email') && !EMAIL_REGEX.test(value)) {
      setEmailError('E-mail inválido');
      e.target.focus();
      return;
    }
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    if (val && !EMAIL_REGEX.test(val)) {
      setEmailError('E-mail inválido');
    } else {
      setEmailError('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value.toUpperCase());
  };

  const handleTelefoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 11) value = value.substring(0, 11);

    let formatted = value;
    if (value.length > 0) {
      formatted = `(${value.substring(0, 2)}`;
      if (value.length > 2) {
        formatted += `)${value.substring(2, 7)}`;
        if (value.length > 7) {
          formatted += `-${value.substring(7, 11)}`;
        }
      }
    }
    setTelefone(formatted);
  };

  const handleTelefoneBlur = () => {
    if (telefone && telefone.length < 14) {
      setTelefone('');
    }
    // Advance focus to role select
    roleSelectRef.current?.focus();
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      const url = URL.createObjectURL(file);
      setAvatarPreview(url);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center relative overflow-hidden bg-background-dark font-display">
      {/* Background Decor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/2 pointer-events-none" />

      <div className="w-full max-w-md px-8 py-10 z-10 flex flex-col h-full md:h-auto min-h-[600px] justify-center transition-all duration-500">

        {/* Header Section */}
        <div className="flex flex-col items-center mb-8">
          <div className="mb-6 relative">
            <div className="absolute inset-0 bg-primary/30 blur-2xl rounded-full transform scale-150 opacity-20 pointer-events-none"></div>
            <img
              src={LOGO_URL}
              alt="Logo"
              className="h-28 w-auto object-contain relative z-10 drop-shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <h2 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {isRegistering ? 'Crie sua conta' : 'Bem-vindo'}
          </h2>
          <p className="text-slate-400 text-center text-sm max-w-[260px]">
            {isRegistering
              ? 'Preencha os dados abaixo para começar'
              : 'Acesse o sistema de gestão e controle'}
          </p>
        </div>

        {/* Form Section */}
        <form onSubmit={handleSubmit} className="space-y-5 w-full" autoComplete="off">

          {/* Anti-Autofill Hack */}
          <input type="text" className="hidden" aria-hidden="true" tabIndex={-1} title="Honeypot" readOnly />
          <input type="password" className="hidden" aria-hidden="true" tabIndex={-1} title="Honeypot" readOnly />

          {isRegistering && (
            <>
              {/* Refactored Avatar Upload Section */}
              <div className="flex justify-center mb-6">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                  aria-label="Upload de Avatar"
                  title="Upload de Avatar"
                />
                <div className="relative group">
                  {/* Circular Avatar Display */}
                  <div
                    onClick={handleAvatarClick}
                    className={`w-28 h-28 rounded-full border-2 ${avatarPreview ? 'border-primary' : 'border-dashed border-slate-600'} bg-surface/30 flex items-center justify-center relative cursor-pointer hover:border-primary transition-all overflow-hidden shadow-2xl`}
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="Avatar Preview" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} className="text-slate-500 group-hover:text-slate-400 transition-colors" />
                    )}
                  </div>

                  {/* Centered Camera Badge (Outside overflow to prevent clipping) */}
                  <div
                    onClick={handleAvatarClick}
                    className="absolute bottom-0 right-0 bg-primary w-11 h-11 rounded-full shadow-xl flex items-center justify-center cursor-pointer ring-4 ring-background-dark hover:scale-110 active:scale-95 transition-all z-20 group-hover:shadow-primary/30"
                  >
                    <Camera size={22} className="text-white" />
                  </div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                    <User size={20} />
                  </div>
                  <input
                    type="text"
                    name="register_name"
                    autoComplete="name"
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder="Nome Completo"
                    aria-label="Nome Completo"
                    required
                    value={name}
                    onChange={handleNameChange}
                    onBlur={handleStrictBlur}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                    <Phone size={20} />
                  </div>
                  <input
                    type="tel"
                    name="register_phone"
                    className="block w-full pl-12 pr-4 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                    placeholder="Telefone / WhatsApp"
                    aria-label="Telefone ou WhatsApp"
                    value={telefone}
                    onChange={handleTelefoneChange}
                    onBlur={handleTelefoneBlur}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                    <Users size={20} />
                  </div>
                  <select
                    name="register_role"
                    ref={roleSelectRef}
                    className="block w-full pl-12 pr-10 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white appearance-none cursor-pointer"
                    aria-label="Cargo ou Função"
                    required
                    value={role}
                    onChange={(e) => setRole(e.target.value as 'admin' | 'staff')}
                  >
                    <option value="staff" className="bg-slate-900 text-white">Funcionário (Staff)</option>
                    <option value="admin" className="bg-slate-900 text-white">Administrador</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <ChevronDown size={20} />
                  </div>
                </div>
              </div>
            </>
          )}
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                <Mail size={20} />
              </div>
              <input
                type="email"
                name="user_email"
                autoComplete="off"
                className={`block w-full pl-12 pr-4 py-3.5 bg-surface/50 border ${emailError ? 'border-red-500' : 'border-slate-700'} rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600`}
                placeholder="Seu E-mail"
                aria-label="E-mail"
                required
                value={email}
                onChange={handleEmailChange}
                onBlur={handleStrictBlur}
              />
            </div>
            {emailError && <p className="text-xs text-red-500 ml-2 font-medium">{emailError}</p>}
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                <Lock size={20} />
              </div>
              {isRegistering ? (
                <input
                  type={showPassword ? "text" : "password"}
                  name="user_password_new"
                  autoComplete="off"
                  className="block w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                  placeholder="Senha"
                  aria-label="Definir Senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleStrictBlur}
                />
              ) : (
                <input
                  type={showPassword ? "text" : "password"}
                  name="user_password"
                  autoComplete="off"
                  className="block w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                  placeholder="Senha"
                  aria-label="Senha"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onBlur={handleStrictBlur}
                />
              )}
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                tabIndex={-1}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1">
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500 group-focus-within:text-primary transition-colors">
                  <Lock size={20} />
                </div>
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  name="confirm_password"
                  autoComplete="new-password"
                  className="block w-full pl-12 pr-12 py-3.5 bg-surface/50 border border-slate-700 rounded-2xl focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-white placeholder:text-slate-600"
                  placeholder="Confirmar Senha"
                  aria-label="Confirmar Senha"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  onBlur={handleStrictBlur}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center cursor-pointer text-slate-500 hover:text-slate-300 transition-colors"
                  tabIndex={-1}
                >
                  {showConfirmPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading || !!emailError}
            className="w-full bg-primary hover:bg-primary-dark text-white font-bold py-4 rounded-2xl shadow-lg shadow-primary/25 active:scale-[0.98] transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed mt-2"
          >
            {isLoading ? (
              <span className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                <span>{isRegistering ? 'Cadastrar' : 'Entrar no Sistema'}</span>
                {isRegistering ? <UserPlus size={20} /> : <LogIn size={20} />}
              </>
            )}
          </button>
        </form>

        {/* Footer Section */}
        <div className="mt-8 space-y-6">
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800"></div>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase font-bold tracking-widest">
              <span className="bg-background-dark px-4 text-slate-500">
                {isRegistering ? 'Já possui conta?' : 'Ou acesse com biometria'}
              </span>
            </div>
          </div>

          {isRegistering ? (
            <div className="flex justify-center">
              <button
                onClick={() => {
                  setIsRegistering(false);
                  setEmailError('');
                }}
                className="text-primary hover:text-primary-dark font-bold text-sm transition-colors uppercase tracking-wide"
              >
                Voltar para o Login
              </button>
            </div>
          ) : (
            <>
              <div className="flex justify-center gap-4">
                <button className="group p-4 rounded-3xl bg-surface/30 border border-slate-800 hover:bg-surface hover:border-slate-700 transition-all flex flex-col items-center min-w-[100px]">
                  <Fingerprint size={32} className="text-slate-500 group-hover:text-primary mb-2 transition-colors" />
                  <span className="text-[10px] font-bold text-slate-500 group-hover:text-slate-300 uppercase tracking-wider">Acesso Rápido</span>
                </button>
              </div>

              <div className="flex justify-center pt-2">
                <span className="text-slate-500 text-sm">Não tem conta? </span>
                <button
                  onClick={() => setIsRegistering(true)}
                  className="ml-1 text-primary hover:text-primary-dark font-bold text-sm transition-colors"
                >
                  Registrar-se agora
                </button>
              </div>
            </>
          )}

          <div className="text-center pb-4 md:pb-0 pt-4 border-t border-slate-800/50">
            <p className="text-[10px] text-slate-400 flex items-center justify-center gap-1 tracking-tight">
              Desenvolvido por: <span className="font-bold text-white">CKDEV Desenvolvimentos</span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;