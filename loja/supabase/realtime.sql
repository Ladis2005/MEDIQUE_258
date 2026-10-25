-- Avisos instantâneos de encomendas no painel.
-- Corra uma vez no SQL Editor do Supabase (projetos criados antes desta atualização).
-- Os projetos novos já recebem isto em schema.sql.
alter publication supabase_realtime add table orders;
