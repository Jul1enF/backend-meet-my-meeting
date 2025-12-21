const defaultExpirationDate = 1000 * 60 * 60 * 24 * 30 * 2; // 2 months, le mettre pour appointments et break

const expiresAt = new Date(Date.now() + defaultExpirationDate);

// Recherche sur une plage de durée
Event.find({
  start: { $lt: endDate },
  end:   { $gt: startDate }
});


// Recherche sur une plage de durée d'une semaine pour un employé
Event.find({
  employee: employeeId,
  start: { $gte: weekStart, $lt: weekEnd }
});

// Recherche des rdv d'un client
Event.find({
  client: clientId,
  start: { $gte: now }
});