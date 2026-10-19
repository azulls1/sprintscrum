-- GENERADO por scripts/preparar_entregables.py — catálogo de entregables
begin;
delete from public."SprintScrum_entregables";
insert into public."SprintScrum_entregables" (ruta, nombre, tipo, criterio, detalle, bytes, sha256, orden) values
    ('documento/Actividad1_Grupal_Equipo2073F.docx', 'Documento de la actividad (Word)', 'Documento', 'Entrega', 'Los seis apartados que pide el enunciado · Calibri 12 · interlineado 1,5', 41859, 'bf0bf472417268617fe1b788302fe939cd2b8991229e2587f7890a03de5e0d51', 0),
    ('documento/Actividad1_Grupal_Equipo2073F.pdf', 'Documento de la actividad (PDF)', 'PDF', 'Entrega', 'El mismo documento en PDF, listo para leer', 76801, '5a7834c24e4110e54645184269df30a0e8b713ca229977580ad17bbb9e799eaf', 1),
    ('documento/Actividad1_Grupal_Equipo2073F_Moodle.zip', 'Entrega para Moodle', 'Paquete', 'Entrega', 'Documento .docx + .pdf y un LEEME que ubica cada criterio de la rúbrica', 114279, 'bb1097a02e963d1c8f85f0075618b80d977d83757eaa153f0abb22c18a420a32', 2),
    ('datos/product_backlog.csv', 'Product backlog', 'Datos', 'C2', 'Historias con prioridad y puntos', 1090, '7d99c5e12559d7ad9f25c854149590c647c269abf4f48f451962ac9f3e651edc', 3),
    ('datos/sprint_backlog.csv', 'Sprint backlog', 'Datos', 'C3', 'Tareas con responsable, horas, días del plan y dependencias', 1570, '04abf3fe7544a2ea57519ab1b961e1a1db40e682f4a669e3a8c55ea34d2be5be', 4),
    ('datos/roles.csv', 'Roles Scrum', 'Datos', 'Roles', 'Integrante, rol y responsabilidad', 559, '9f2af8809bd30541a659168e1c05f8ae910dac49bb2a942a933d48dab4dff9a3', 5),
    ('figuras/arquitectura.png', 'Arquitectura', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 179034, '436411ee32b4fad35fe193cf485d128d8e14a9ff76f4f3baa3dd5e51f8a0cedc', 6),
    ('figuras/ciclo-scrum.png', 'Ciclo scrum', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 123319, 'b7040300cd145062e5de2312a8f4ca51042406ab08cc2340bf55f6f2e77e2a11', 7),
    ('figuras/equipo-scrum.png', 'Equipo scrum', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 178829, '981a8ce0dc13f09fea5359d0281d1909beee09cc3ef05495dc75a606b36fd2b1', 8),
    ('figuras/estados-cita.png', 'Estados cita', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 139369, '5a1667e7ec7f80bb43e8b08904bef6520ec4ef438a32ae08ead793a27acb9006', 9),
    ('figuras/gantt-sprint.png', 'Gantt sprint', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 249197, '13d5679a7aaab88cb7533d4630bab608083b5026843c369698e18807cf19eac0', 10),
    ('figuras/product-backlog.png', 'Product backlog', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 166582, '11dc5f4e8a9d42553f126ec36bdfe6760c37c4406b2d9064184241a72ca32a13', 11),
    ('figuras/recorrido-paciente.png', 'Recorrido paciente', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 294448, '9319d0e880d4d9f4233ff2d71f1bea827f1a6063f235292aed7bfab68e8f45ef', 12),
    ('figuras/secuencia-simulacion.png', 'Secuencia simulacion', 'Figura', 'Figuras', 'Diagrama · PNG 2x', 112671, '8f74376e9bf44ffa6eee6d33d9e3af292a019b680a7fae65ae42074b7c35154d', 13),
    ('figuras/anatomia-sprint.png', 'Anatomía del sprint', 'Figura', 'Figuras', 'Figura isométrica interactiva', 792482, '783181526f69e415dd88e9ee1c58d46e45da5161764a81f9095e07ee6f08b830', 14),
    ('especificaciones/specs/001-portal-sprintscrum/checklists/requisitos.md', 'requisitos.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum/checklists', 3235, 'fbcdc51a0d4921dec4db070c4d772eaca2ce43d1b6c80c9b318b4bf6a6233080', 15),
    ('especificaciones/specs/001-portal-sprintscrum/contracts/api.md', 'api.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum/contracts', 12976, '5907df3169edc7efc1fb2326e671df34d75f960f04059e032d19411e4f388f0c', 16),
    ('especificaciones/specs/001-portal-sprintscrum/data-model.md', 'data-model.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 8925, '7def432cbeaa345cc7407941bb0d934b1359fdff80d0328132252d5915636463', 17),
    ('especificaciones/specs/001-portal-sprintscrum/plan.md', 'plan.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 8807, '8b27f4d42eedad116c04957e1de721d61075c1328a9c3f2cb276381334d88a2a', 18),
    ('especificaciones/specs/001-portal-sprintscrum/quickstart.md', 'quickstart.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 5528, '40615a54a2ecc81ebbc1a5fd9ff38bb73d3b0ae396ebd626159c729c10ea06ba', 19),
    ('especificaciones/specs/001-portal-sprintscrum/research.md', 'research.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 8910, 'ce330dc7fc2e65d3b196af8847103188215aa357a56347d778e2cc9dafa54b52', 20),
    ('especificaciones/specs/001-portal-sprintscrum/spec.md', 'spec.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 20687, 'a40548f86909ba65f59ffe0123273b82acfaa2941c33479ea80e0311e23331c3', 21),
    ('especificaciones/specs/001-portal-sprintscrum/tasks.md', 'tasks.md', 'Especificación', 'spec-kit', 'specs/001-portal-sprintscrum', 14628, 'ffa2b396807548cc6c632a752be204b4c4525bedb6eff228a1f175278f9b54ef', 22),
    ('especificaciones/constitution.md', 'constitution.md', 'Especificación', 'spec-kit', 'Principios del proyecto', 7312, 'd21cb499d14f271a018dacdb0d95b8266ffb8a3a6009e924c0f3d7e86ba5e6fc', 23),
    ('bmad/implementation-artifacts/sprint-status.yaml', 'sprint-status.yaml', 'BMAD', 'BMAD', 'implementation-artifacts', 1996, 'f41acff3b0a6d5b4ab94b9b8aa83e0773f61a7e9a568edcfe98957693420f6ab', 24),
    ('bmad/planning-artifacts/architecture.md', 'architecture.md', 'BMAD', 'BMAD', 'planning-artifacts', 9702, 'eae76d8f0015317c09106dc46f1912dd60eb11dcd9b3be3b2fd4a361707f4612', 25),
    ('bmad/planning-artifacts/epics.md', 'epics.md', 'BMAD', 'BMAD', 'planning-artifacts', 8890, 'b8152b1b16b5ec07075ce68e0bb0d9a45c7c7fad823c731f165d42f2bb5c86cc', 26),
    ('bmad/planning-artifacts/prd.md', 'prd.md', 'BMAD', 'BMAD', 'planning-artifacts', 6453, 'c26752a85e77079bd38ad712ccc7b69928c111a4c8377fa5853b44b046dfd4ae', 27),
    ('bmad/planning-artifacts/product-brief.md', 'product-brief.md', 'BMAD', 'BMAD', 'planning-artifacts', 4296, '57bc2373ec7b4efe56b998a2154a32dca2ebf467c65ef1eddc948166b5911756', 28);
commit;
