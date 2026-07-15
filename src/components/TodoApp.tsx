import { useEffect, useState, type FormEvent } from 'react';
import {
  Plus,
  Trash2,
  Check,
  LogOut,
  CheckSquare,
  Folder,
  FolderOpen,
  Loader2,
  Inbox,
  Sparkles,
  Pencil,
} from 'lucide-react';
import { supabase, type Category, type Todo } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

type Filter = 'all' | number | null;

export default function TodoApp() {
  const { user, signOut } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [todos, setTodos] = useState<Todo[]>([]);
  const [filter, setFilter] = useState<Filter>('all');
  const [newCategory, setNewCategory] = useState('');
  const [newTodo, setNewTodo] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null);
  const [recommendationItems, setRecommendationItems] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void loadAll();
  }, []);

  const loadAll = async () => {
    setLoading(true);
    const [catRes, todoRes] = await Promise.all([
      supabase.from('categories').select('*').order('created_at', { ascending: true }),
      supabase.from('todos').select('*').order('created_at', { ascending: false }),
    ]);
    if (catRes.data) setCategories(catRes.data);
    if (todoRes.data) setTodos(todoRes.data);
    setLoading(false);
  };

  const addCategory = async (e: FormEvent) => {
    e.preventDefault();
    const name = newCategory.trim();
    if (!name) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('categories')
      .insert({ name })
      .select()
      .single();
    setBusy(false);
    if (error) return;
    setCategories((prev) => [...prev, data]);
    setNewCategory('');
  };

  const deleteCategory = async (id: number) => {
    setBusy(true);
    const { error } = await supabase.from('categories').delete().eq('id', id);
    setBusy(false);
    if (error) return;
    setCategories((prev) => prev.filter((c) => c.id !== id));
    setTodos((prev) =>
      prev.map((t) => (t.category_id === id ? { ...t, category_id: null } : t)),
    );
    if (filter === id) setFilter('all');
  };

  const ensureHealthCategory = async () => {
    if (!user) throw new Error('로그인 필요');

    const { data: existingCategory } = await supabase
      .from('categories')
      .select('id')
      .eq('name', '건강')
      .eq('user_id', user.id)
      .maybeSingle();

    if (existingCategory?.id) return existingCategory.id;

    const { data: createdCategory, error } = await supabase
      .from('categories')
      .insert({ name: '건강' })
      .select('id')
      .single();

    if (error || !createdCategory) throw error ?? new Error('카테고리 생성 실패');
    return createdCategory.id;
  };

  const openHealthRecommendations = async () => {
    setBusy(true);

    try {
      const healthCategoryId = await ensureHealthCategory();
      setSelectedCategory(healthCategoryId);
      setFilter(healthCategoryId);
      setRecommendationItems(['산책 10분', '물 3잔 마시기', '30분 러닝']);
      await loadAll();
    } finally {
      setBusy(false);
    }
  };

  const addRecommendedTodo = async (title: string) => {
    setBusy(true);

    try {
      const healthCategoryId = await ensureHealthCategory();
      const { data, error } = await supabase
        .from('todos')
        .insert({ title, category_id: healthCategoryId })
        .select()
        .single();

      if (error || !data) throw error ?? new Error('추천 항목 추가 실패');

      setTodos((prev) => [data, ...prev]);
      setRecommendationItems((prev) => prev.filter((item) => item !== title));
      setSelectedCategory(healthCategoryId);
      setFilter(healthCategoryId);
    } finally {
      setBusy(false);
    }
  };

  const addTodo = async (e: FormEvent) => {
    e.preventDefault();
    const title = newTodo.trim();
    if (!title) return;
    setBusy(true);
    const { data, error } = await supabase
      .from('todos')
      .insert({ title, category_id: selectedCategory })
      .select()
      .single();
    setBusy(false);
    if (error) return;
    setTodos((prev) => [data, ...prev]);
    setNewTodo('');
    setSelectedCategory(null);
  };

  const toggleTodo = async (todo: Todo) => {
    setTodos((prev) =>
      prev.map((t) => (t.id === todo.id ? { ...t, is_done: !t.is_done } : t)),
    );
    await supabase.from('todos').update({ is_done: !todo.is_done }).eq('id', todo.id);
  };

  const deleteTodo = async (id: number) => {
    setTodos((prev) => prev.filter((t) => t.id !== id));
    await supabase.from('todos').delete().eq('id', id);
  };

  const startEditTodo = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditingTitle(todo.title);
    setEditingCategoryId(todo.category_id);
  };

  const cancelEditTodo = () => {
    setEditingTodoId(null);
    setEditingTitle('');
    setEditingCategoryId(null);
  };

  const saveEditTodo = async (id: number) => {
    const title = editingTitle.trim();
    if (!title) return;

    setBusy(true);
    const { data, error } = await supabase
      .from('todos')
      .update({ title, category_id: editingCategoryId })
      .eq('id', id)
      .select()
      .single();
    setBusy(false);

    if (error || !data) return;

    setTodos((prev) => prev.map((todo) => (todo.id === id ? { ...todo, title: data.title, category_id: data.category_id } : todo)));
    cancelEditTodo();
  };

  const categoryName = (id: number | null) =>
    id === null ? null : categories.find((c) => c.id === id)?.name ?? null;

  const filteredTodos =
    filter === 'all' ? todos : todos.filter((t) => t.category_id === filter);

  const counts = {
    all: todos.length,
    none: todos.filter((t) => t.category_id === null).length,
    perCategory: (id: number) => todos.filter((t) => t.category_id === id).length,
  };

  const doneCount = filteredTodos.filter((t) => t.is_done).length;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-green-100">
      <header className="bg-white/80 border-b border-emerald-100 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-600/20">
              <CheckSquare className="w-5 h-5 text-white" strokeWidth={2.2} />
            </div>
            <div>
              <h1 className="text-base font-bold text-slate-900 leading-tight">Tasked</h1>
              <p className="text-xs text-slate-400 leading-tight">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={() => void signOut()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">로그아웃</span>
          </button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
          {/* Sidebar: categories */}
          <aside className="space-y-6">
            <div className="bg-white/90 rounded-2xl border border-emerald-100 p-5 shadow-sm shadow-emerald-100/50">
              <div className="flex items-center gap-2 mb-4">
                <Folder className="w-4 h-4 text-slate-400" />
                <h2 className="text-sm font-semibold text-slate-900">카테고리</h2>
              </div>

              <ul className="space-y-1 mb-4">
                <li>
                  <button
                    onClick={() => setFilter('all')}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter === 'all'
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <Inbox className="w-4 h-4" />
                      전체
                    </span>
                    <span className="text-xs text-slate-400">{counts.all}</span>
                  </button>
                </li>
                <li>
                  <button
                    onClick={() => setFilter(null)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                      filter === null
                        ? 'bg-blue-50 text-blue-700 font-medium'
                        : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FolderOpen className="w-4 h-4" />
                      카테고리 없음
                    </span>
                    <span className="text-xs text-slate-400">{counts.none}</span>
                  </button>
                </li>
                {categories.map((cat) => (
                  <li key={cat.id} className="group">
                    <div
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-sm transition-colors ${
                        filter === cat.id
                          ? 'bg-emerald-50 text-emerald-700 font-medium'
                          : 'text-slate-600 hover:bg-emerald-50/70'
                      }`}
                    >
                      <button
                        onClick={() => setFilter(cat.id)}
                        className="flex items-center gap-2 flex-1 min-w-0 text-left"
                      >
                        <Folder className="w-4 h-4 shrink-0" />
                        <span className="truncate">{cat.name}</span>
                      </button>
                      <div className="flex items-center gap-1 shrink-0">
                        <span className="text-xs text-slate-400">{counts.perCategory(cat.id)}</span>
                        <button
                          onClick={() => void deleteCategory(cat.id)}
                          disabled={busy}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-all disabled:opacity-30"
                          title="카테고리 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <form onSubmit={addCategory} className="flex gap-2">
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  placeholder="새 카테고리"
                  className="flex-1 min-w-0 px-3 py-2 text-sm bg-emerald-50/70 border border-emerald-100 rounded-lg text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
                />
                <button
                  type="submit"
                  disabled={busy || !newCategory.trim()}
                  className="shrink-0 w-9 h-9 flex items-center justify-center bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white rounded-lg transition-colors"
                  title="카테고리 추가"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </form>
            </div>
          </aside>

          {/* Main: todos */}
          <section className="bg-white/90 rounded-2xl border border-emerald-100 p-5 sm:p-6 shadow-sm shadow-emerald-100/60">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-900">
                {filter === 'all'
                  ? '전체 할 일'
                  : filter === null
                    ? '카테고리 없음'
                    : categoryName(filter as number) ?? '카테고리 없음'}
              </h2>
              {!loading && filteredTodos.length > 0 && (
                <span className="text-xs text-slate-400">
                  {doneCount} / {filteredTodos.length} 완료
                </span>
              )}
            </div>

            <form onSubmit={addTodo} className="flex flex-col sm:flex-row gap-2 mb-6">
              <input
                type="text"
                value={newTodo}
                onChange={(e) => setNewTodo(e.target.value)}
                placeholder="할 일을 입력하세요"
                className="flex-1 px-4 py-2.5 text-sm bg-emerald-50/70 border border-emerald-100 rounded-xl text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all"
              />
              <select
                value={selectedCategory ?? ''}
                onChange={(e) =>
                  setSelectedCategory(e.target.value ? Number(e.target.value) : null)
                }
                className="px-3 py-2.5 text-sm bg-emerald-50/70 border border-emerald-100 rounded-xl text-slate-700 focus:bg-white focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/10 outline-none transition-all sm:w-44"
              >
                <option value="">카테고리 미선택</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => void openHealthRecommendations()}
                disabled={busy}
                className="shrink-0 px-3 py-2.5 border border-emerald-200 bg-emerald-50 text-emerald-700 text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5 disabled:opacity-40"
              >
                <Sparkles className="w-4 h-4" />
                추천받기
              </button>
              <button
                type="submit"
                disabled={busy || !newTodo.trim()}
                className="shrink-0 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-40 text-white text-sm font-semibold rounded-xl transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                추가
              </button>
            </form>

            {recommendationItems.length > 0 && (
              <div className="mb-6 rounded-2xl border border-emerald-200 bg-emerald-50/70 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                    <Sparkles className="w-4 h-4" />
                    건강 추천 항목
                  </div>
                  <button
                    type="button"
                    onClick={() => setRecommendationItems([])}
                    className="text-xs text-slate-500 hover:text-slate-700"
                  >
                    닫기
                  </button>
                </div>
                <ul className="space-y-2">
                  {recommendationItems.map((item) => (
                    <li key={item} className="flex items-center justify-between rounded-xl bg-white px-3 py-2 text-sm text-slate-700">
                      <span>{item}</span>
                      <button
                        type="button"
                        onClick={() => void addRecommendedTodo(item)}
                        disabled={busy}
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                      >
                        추가
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {loading ? (
              <div className="flex items-center justify-center py-16 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin" />
              </div>
            ) : filteredTodos.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <CheckSquare className="w-10 h-10 mb-3 opacity-40" />
                <p className="text-sm">아직 할 일이 없습니다</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {filteredTodos.map((todo) => {
                  const cat = categoryName(todo.category_id);
                  return (
                    <li
                      key={todo.id}
                      className="group flex items-center gap-3 p-3 rounded-xl border border-emerald-100 hover:border-emerald-200 hover:bg-emerald-50/50 transition-all"
                    >
                      <button
                        onClick={() => void toggleTodo(todo)}
                        className={`shrink-0 w-5 h-5 rounded-md border-2 flex items-center justify-center transition-all ${
                          todo.is_done
                            ? 'bg-emerald-600 border-emerald-600 text-white'
                            : 'border-slate-300 hover:border-emerald-500'
                        }`}
                      >
                        {todo.is_done && <Check className="w-3.5 h-3.5" strokeWidth={3} />}
                      </button>

                      {editingTodoId === todo.id ? (
                        <div className="flex-1 min-w-0 space-y-2">
                          <input
                            value={editingTitle}
                            onChange={(e) => setEditingTitle(e.target.value)}
                            className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-900 outline-none"
                          />
                          <select
                            value={editingCategoryId ?? ''}
                            onChange={(e) => setEditingCategoryId(e.target.value ? Number(e.target.value) : null)}
                            className="w-full rounded-lg border border-emerald-200 bg-emerald-50/70 px-3 py-2 text-sm text-slate-700 outline-none"
                          >
                            <option value="">카테고리 미선택</option>
                            {categories.map((cat) => (
                              <option key={cat.id} value={cat.id}>
                                {cat.name}
                              </option>
                            ))}
                          </select>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => void saveEditTodo(todo.id)}
                              disabled={busy || !editingTitle.trim()}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-40"
                            >
                              저장
                            </button>
                            <button
                              type="button"
                              onClick={cancelEditTodo}
                              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600"
                            >
                              취소
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-1 min-w-0">
                          <p
                            className={`text-sm transition-colors ${
                              todo.is_done
                                ? 'text-slate-400 line-through'
                                : 'text-slate-900'
                            }`}
                          >
                            {todo.title}
                          </p>
                          <span
                            className={`inline-block mt-0.5 text-xs px-1.5 py-0.5 rounded ${
                              cat
                                ? 'bg-blue-50 text-blue-600'
                                : 'bg-slate-100 text-slate-400'
                            }`}
                          >
                            {cat ?? '카테고리 없음'}
                          </span>
                        </div>
                      )}

                      {editingTodoId !== todo.id && (
                        <div className="flex shrink-0 items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                          <button
                            type="button"
                            onClick={() => startEditTodo(todo)}
                            className="p-1.5 text-slate-400 hover:text-emerald-600"
                            title="수정"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => void deleteTodo(todo.id)}
                            className="p-1.5 text-slate-300 hover:text-red-500"
                            title="삭제"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>
    </div>
  );
}
