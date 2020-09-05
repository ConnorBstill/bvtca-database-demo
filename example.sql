SELECT id, make, model FROM car ORDER BY make ASC, model DESC;

INSERT INTO car (make, model, date_created)
VALUES ("BMW", "M5", NOW());

UPDATE car SET model = "NSX" WHERE id = 3;

DELETE FROM car WHERE id = 3;

SELECT c.id, c.model, m.name AS make_name
FROM car c
LEFT JOIN car_make m
ON c.make_id = m.id;

INSERT INTO `car_make` (`id`, `name`)
VALUES
	(1, 'BMW'),
	(2, 'Honda'),
	(3, 'Toyota'),
	(4, 'Volkswagen'),
	(5, 'Shelby'),
	(6, 'Ford');
