create table public.rutas (id integer primary key, puesto text not null, paso text not null, detalle text not null);
alter table public.rutas enable row level security;
grant select on public.rutas to anon, authenticated;
create policy lectura on public.rutas for select to anon, authenticated using (true);
insert into public.rutas values (1,'Galería','Identificar el local','Anota la galería, el giro y el número de puesto para tu consulta.'),
(2,'Galería','Preparar la consulta','Reúne las preguntas sobre licencia, registro tributario y contratación que necesitas resolver.'),
(3,'Galería','Programar orientación','Consulta con la entidad correspondiente y registra la fecha de seguimiento.'),
(4,'Ambulante','Identificar la zona','Anota tu zona de venta y horario habitual.'),
(5,'Ambulante','Consultar alternativas','Pregunta por espacios autorizados y opciones de orientación para tu actividad.'),
(6,'Ambulante','Organizar el seguimiento','Registra las indicaciones recibidas y el siguiente paso acordado.');
select puesto,count(*) as pasos from public.rutas group by puesto;