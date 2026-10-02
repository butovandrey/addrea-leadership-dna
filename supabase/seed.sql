-- Seed: default session + question catalog
-- Safe to re-run: uses upserts on unique keys.

insert into sessions (name, code, active)
values ('ADDREA Leadership Team', 'addrea-top', true)
on conflict (code) do update set name = excluded.name, active = true;

-- Clear and reseed catalog for deterministic codes
delete from options;
delete from questions;

with q as (
  insert into questions (category, code, title, description, type, max_choices, sort_order) values
    ('beliefs', 'beliefs', 'Во что вы верите как руководитель?', 'Выберите до 4 утверждений, которые наиболее близки вам лично.', 'multi_select', 4, 1),
    ('worldview', 'worldview', 'Как вы в первую очередь воспринимаете организацию?', 'Выберите до двух моделей.', 'worldview', 2, 2),
    ('values', 'values', 'Когда две хорошие вещи конфликтуют, куда вы скорее склоняетесь?', 'Здесь нет правильной стороны шкалы.', 'bipolar', null, 3),
    ('principles', 'principles', 'Какие управленческие принципы вам наиболее близки?', 'Выберите до 5.', 'multi_select', 5, 4),
    ('rules', 'rules', 'Какие правила работы были бы полезны нашей управленческой команде?', 'Выберите до 6.', 'multi_select', 6, 5),
    ('skills', 'skills', 'Какие способности особенно важны для нашей TOP-команды?', 'Выберите ровно 5.', 'multi_select', 5, 6),
    ('habits', 'habits', 'Какие модели поведения должны стать для нас естественными?', 'Выберите до 6.', 'multi_select', 6, 7),
    ('open', 'open_preserve', 'И последний вопрос', 'Черта культуры, которую не хотели бы потерять.', 'text', null, 8)
  returning id, code
)
select * from q;

insert into options (question_id, code, label, description, left_label, right_label, sort_order)
select q.id, o.code, o.label, o.description, o.left_label, o.right_label, o.sort_order
from questions q
join (
  values
    ('beliefs', 'b1', 'Большинство людей хотят хорошо выполнять свою работу.', null, null, null, 1),
    ('beliefs', 'b2', 'Система и среда влияют на результат сильнее отдельных героев.', null, null, null, 2),
    ('beliefs', 'b3', 'Ответственность начинается с личного выбора, а не с должности.', null, null, null, 3),
    ('beliefs', 'b4', 'Ошибка — естественная цена развития и эксперимента.', null, null, null, 4),
    ('beliefs', 'b5', 'Сильная команда способна добиться большего, чем набор сильных индивидуальностей.', null, null, null, 5),
    ('beliefs', 'b6', 'Без доверия невозможно построить зрелую организацию.', null, null, null, 6),
    ('beliefs', 'b7', 'Компания должна постоянно меняться, даже когда всё работает хорошо.', null, null, null, 7),
    ('beliefs', 'b8', 'Ценность для клиента в долгосрочной перспективе важнее краткосрочной выгоды.', null, null, null, 8),
    ('beliefs', 'b9', 'Свобода эффективна только вместе с ответственностью.', null, null, null, 9),
    ('beliefs', 'b10', 'Хороший руководитель создаёт систему, которая работает без его постоянного участия.', null, null, null, 10),

    ('worldview', 'w_system', 'Компания как система', 'Результат возникает из взаимодействия людей, процессов, данных, технологий и управления.', null, null, 1),
    ('worldview', 'w_team', 'Компания как команда', 'Решающим фактором являются сильные люди, отношения между ними и качество взаимодействия.', null, null, 2),
    ('worldview', 'w_organism', 'Компания как живой организм', 'Организация должна постоянно адаптироваться к меняющейся среде.', null, null, 3),
    ('worldview', 'w_entrepreneurial', 'Компания как предпринимательская среда', 'Главное преимущество — замечать возможности и действовать быстрее других.', null, null, 4),
    ('worldview', 'w_machine', 'Компания как механизм', 'Предсказуемый результат возникает благодаря ясным ролям, процессам, стандартам и контролю.', null, null, 5),
    ('worldview', 'w_network', 'Компания как сеть автономных команд', 'Решения должны приниматься максимально близко к месту возникновения информации.', null, null, 6),

    ('values', 'v_speed_accuracy', 'Скорость ↔ Безошибочность', null, 'Скорость', 'Безошибочность', 1),
    ('values', 'v_freedom_control', 'Свобода ↔ Контроль', null, 'Свобода', 'Контроль', 2),
    ('values', 'v_experiment_predictability', 'Эксперимент ↔ Предсказуемость', null, 'Эксперимент', 'Предсказуемость', 3),
    ('values', 'v_team_individual', 'Командный результат ↔ Индивидуальный результат', null, 'Командный результат', 'Индивидуальный результат', 4),
    ('values', 'v_openness_diplomacy', 'Открытость ↔ Дипломатичность', null, 'Открытость', 'Дипломатичность', 5),
    ('values', 'v_client_efficiency', 'Клиент ↔ Внутренняя эффективность', null, 'Клиент', 'Внутренняя эффективность', 6),
    ('values', 'v_long_short', 'Долгосрочный результат ↔ Быстрый результат', null, 'Долгосрочный результат', 'Быстрый результат', 7),
    ('values', 'v_standard_flex', 'Стандартизация ↔ Гибкость', null, 'Стандартизация', 'Гибкость', 8),

    ('principles', 'p1', 'Решение должно приниматься на максимально низком уровне, где достаточно информации.', null, null, null, 1),
    ('principles', 'p2', 'Ответственность должна сопровождаться полномочиями.', null, null, null, 2),
    ('principles', 'p3', 'Плохая новость должна подниматься наверх быстрее хорошей.', null, null, null, 3),
    ('principles', 'p4', 'Несогласие до принятия решения нормально; после решения команда действует согласованно.', null, null, null, 4),
    ('principles', 'p5', 'Лучше достаточно хорошее решение вовремя, чем идеальное слишком поздно.', null, null, null, 5),
    ('principles', 'p6', 'Сначала разбираем систему, затем действия человека.', null, null, null, 6),
    ('principles', 'p7', 'Проблему можно поднять, даже если пока не знаешь её решения.', null, null, null, 7),
    ('principles', 'p8', 'Договорённость существует только тогда, когда она зафиксирована.', null, null, null, 8),
    ('principles', 'p9', 'Повторяющийся ручной процесс — кандидат на стандартизацию или автоматизацию.', null, null, null, 9),
    ('principles', 'p10', 'Руководитель отвечает не только за результат, но и за качество созданной им системы.', null, null, null, 10),

    ('rules', 'r1', 'У каждой задачи есть один конкретный owner.', null, null, null, 1),
    ('rules', 'r2', 'Встреча заканчивается решением, следующим шагом и ответственным.', null, null, null, 2),
    ('rules', 'r3', 'Существенное решение фиксируется письменно.', null, null, null, 3),
    ('rules', 'r4', 'Риск поднимается сразу после обнаружения, а не когда стал проблемой.', null, null, null, 4),
    ('rules', 'r5', 'Повторяющийся процесс должен иметь понятного владельца.', null, null, null, 5),
    ('rules', 'r6', 'Решение пересматривается, если изменились исходные данные.', null, null, null, 6),
    ('rules', 'r7', 'Руководитель не должен быть обязательной точкой согласования каждой операции.', null, null, null, 7),
    ('rules', 'r8', 'Если задача делегирована — вместе с ней передаются необходимые полномочия.', null, null, null, 8),
    ('rules', 'r9', 'После серьёзного сбоя проводится короткий разбор причин.', null, null, null, 9),
    ('rules', 'r10', 'Если регулярную ручную работу разумно автоматизировать — её не оставляют ручной навсегда.', null, null, null, 10),

    ('skills', 's_systems', 'системное мышление', null, null, null, 1),
    ('skills', 's_decisions', 'принятие решений', null, null, null, 2),
    ('skills', 's_prioritization', 'приоритизация', null, null, null, 3),
    ('skills', 's_uncertainty', 'работа с неопределённостью', null, null, null, 4),
    ('skills', 's_finance', 'финансовое мышление', null, null, null, 5),
    ('skills', 's_analytical', 'аналитическое мышление', null, null, null, 6),
    ('skills', 's_data', 'работа с данными', null, null, null, 7),
    ('skills', 's_change', 'управление изменениями', null, null, null, 8),
    ('skills', 's_conflict', 'управление конфликтами', null, null, null, 9),
    ('skills', 's_feedback', 'обратная связь', null, null, null, 10),
    ('skills', 's_delegation', 'делегирование', null, null, null, 11),
    ('skills', 's_people', 'развитие людей', null, null, null, 12),
    ('skills', 's_crossfunc', 'межфункциональная коммуникация', null, null, null, 13),
    ('skills', 's_strategy', 'стратегическое мышление', null, null, null, 14),
    ('skills', 's_ai', 'AI literacy', null, null, null, 15),

    ('habits', 'h1', 'Начинать обсуждение проблемы с фактов.', null, null, null, 1),
    ('habits', 'h2', 'Поднимать проблему сразу после её обнаружения.', null, null, null, 2),
    ('habits', 'h3', 'Фиксировать принятое решение.', null, null, null, 3),
    ('habits', 'h4', 'Завершать встречу конкретными next steps.', null, null, null, 4),
    ('habits', 'h5', 'Давать прямую обратную связь.', null, null, null, 5),
    ('habits', 'h6', 'Проверять результат принятого решения спустя время.', null, null, null, 6),
    ('habits', 'h7', 'Делать короткий postmortem после существенных ошибок.', null, null, null, 7),
    ('habits', 'h8', 'Регулярно задавать вопрос: «Зачем мы это делаем?»', null, null, null, 8),
    ('habits', 'h9', 'Не делать вручную то, что разумно автоматизировать.', null, null, null, 9),
    ('habits', 'h10', 'Перед новой инициативой определять ожидаемый результат.', null, null, null, 10),
    ('habits', 'h11', 'Спрашивать мнение человека, который непосредственно работает с проблемой.', null, null, null, 11),
    ('habits', 'h12', 'Не откладывать обратимое решение из-за недостатка идеальной информации.', null, null, null, 12)
) as o(question_code, code, label, description, left_label, right_label, sort_order)
  on q.code = o.question_code;
