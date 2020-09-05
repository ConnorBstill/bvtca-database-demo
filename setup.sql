-- Create syntax for TABLE 'car'
CREATE TABLE `car` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `make_id` int(11) unsigned NOT NULL,
  `model` varchar(255) DEFAULT NULL,
  `date_created` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=13 DEFAULT CHARSET=latin1;

-- Create syntax for TABLE 'car_make'
CREATE TABLE `car_make` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL DEFAULT '',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;

INSERT INTO `car` (`id`, `make_id`, `model`, `date_created`)
VALUES
	(1, 1, 'Z8', '2020-05-30 13:33:03'),
	(2, 6, 'GT', '2020-05-30 13:33:44'),
	(4, 5, 'Cobra', '2020-05-30 13:37:28'),
	(5, 2, 'NSX', '2020-05-30 13:41:04'),
	(6, 3, 'Tacoma', '2020-05-30 13:43:05'),
	(7, 4, 'Golf', '2020-05-30 13:43:14'),
	(8, 1, '328', '2020-05-30 13:45:31'),
	(9, 1, '230', '2020-05-30 13:46:09'),
	(10, 1, 'M1', '2020-05-30 13:46:15'),
	(11, 1, 'M5', '2020-05-30 13:46:17');

INSERT INTO `car_make` (`id`, `name`)
VALUES
	(1, 'BMW'),
	(2, 'Honda'),
	(3, 'Toyota'),
	(4, 'Volkswagen'),
	(5, 'Shelby'),
	(6, 'Ford');
