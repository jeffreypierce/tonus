// cal.ts — liturgical feast entries generated from Divinum Officium
// Sancti IDs: MM-DD stem matching horas/Latin/Sancti/MM-DD.txt
// Tempora IDs: DO stem matching horas/Latin/Tempora/STEM.txt
// Regenerate: node scripts/gen-cal.mjs

export interface CalEntry {
  id: string;      // "MM-DD" for Sancti, DO stem (e.g. "Adv1-0") for Tempora
  name: string;
  rank: number;    // simplified 1 (highest) … 4 (lowest), from DO numeric rank
  gradus?: string; // authentic rank from the DO [Rank] line, e.g. "Duplex majus"
}

export const CAL_SANCTI: CalEntry[] = [
  {
    "id": "01-01",
    "name": "In Circumcisione Domini",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "01-02",
    "name": "In Octava S. Stephani Protomartyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "01-03",
    "name": "In Octava S. Joannis Apostoli et Evangelistæ",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "01-04",
    "name": "In Octava Ss. Innocentium",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "01-05",
    "name": "In Vigilia Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-06",
    "name": "In Epiphania Domini",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "01-07",
    "name": "Secunda die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-08",
    "name": "Tertia die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-09",
    "name": "Quarta die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-10",
    "name": "Quinta die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-11",
    "name": "Sexta die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-12",
    "name": "Septima die infra Octavam Epiphaniæ",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-13",
    "name": "In Commemoratione Baptismatis Domini Nostri Jesu Christi",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "01-14",
    "name": "S. Hilarii Episcopi Confessoris Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "01-15",
    "name": "S. Pauli Primi Eremitæ et Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "01-16",
    "name": "S. Marcelli Papæ et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-17",
    "name": "S. Antonii Abbatis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "01-18",
    "name": "Cathedræ S. Petri Romæ",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "01-19",
    "name": "Ss. Marii, Marthæ, Audifacis, et Abachum Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "01-20",
    "name": "Ss. Fabiani et Sebastiani Martyrum",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "01-21",
    "name": "S. Agnetis Virginis et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "01-22",
    "name": "Ss. Vincentii et Anastasii Martyrum",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-23",
    "name": "S. Raymundi de Peñafort Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-24",
    "name": "S. Timothei Episcopi et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "01-25",
    "name": "In Conversione S. Pauli Apostoli",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "01-26",
    "name": "S. Polycarpi Episcopi et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "01-27",
    "name": "S. Joannis Chrysostomi Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "01-28",
    "name": "S. Petri Nolasci Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "01-29",
    "name": "S. Francisci Salesii Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "01-30",
    "name": "S. Martinæ Virginis et Martyris",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "01-31",
    "name": "S. Joannis Bosco Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "02-01",
    "name": "S. Ignatii Episcopi et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-02",
    "name": "In Purificatione Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "02-03",
    "name": "S. Blasii Episcopi et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "02-04",
    "name": "S. Andreæ Corsini Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-05",
    "name": "S. Agathæ Virginis et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-06",
    "name": "S. Titi Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-07",
    "name": "S. Romualdi Abbatis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-08",
    "name": "S. Joannis de Matha Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-09",
    "name": "S. Cyrilli Episc. Alexandrini Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "02-10",
    "name": "S. Scholasticæ Virginis",
    "rank": 2,
    "gradus": "Duplex"
  },
  {
    "id": "02-11",
    "name": "In Apparitione Beatæ Mariæ Virginis Immaculatæ",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "02-12",
    "name": "Ss. Septem Fundatorum Ordinis Servorum B. M. V.",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "02-14",
    "name": "S. Valentini Presbyteri et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "02-15",
    "name": "SS. Faustini et Jovitæ",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "02-18",
    "name": "S. Simeonis Episcopi et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "02-22",
    "name": "In Cathedra S. Petri Apostoli Antiochiæ",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "02-24",
    "name": "S. Matthiæ Apostoli",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "02-27",
    "name": "S. Gabrielis a Virgine Perdolente Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-04",
    "name": "S. Casimiri Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "03-06",
    "name": "Ss. Perpetuæ et Felicitatis Martyrum",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-07",
    "name": "S. Thomæ de Aquino Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-08",
    "name": "S. Joannis de Deo Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-09",
    "name": "S. Franciscæ Romanæ Viduæ",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-10",
    "name": "Ss. Quadraginta Martyrum",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "03-12",
    "name": "S. Gregorii Papæ Confessoris et Ecclesiæ Doctoris",
    "rank": 2,
    "gradus": "Duplex"
  },
  {
    "id": "03-17",
    "name": "S. Patricii Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "03-18",
    "name": "S. Cyrilli Episcopi Hierosolymitani Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "03-19",
    "name": "S. Joseph Sponsi B.M.V. Confessoris",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "03-21",
    "name": "S. Benedicti Abbatis",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "03-24",
    "name": "S. Gabrielis Archangeli",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "03-25",
    "name": "In Annuntiatione Beatæ Mariæ Virginis",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "03-27",
    "name": "S. Joannis Damasceni Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "03-28",
    "name": "S. Joannis a Capistrano Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "04-02",
    "name": "S. Francisci de Paula Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-04",
    "name": "S. Isidori Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "04-05",
    "name": "S. Vincentii Ferrerii Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-11",
    "name": "S. Leonis I Papæ Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-13",
    "name": "S. Hermenegildi Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "04-14",
    "name": "S. Justini Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-17",
    "name": "S. Aniceti Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "04-21",
    "name": "S. Anselmi Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-22",
    "name": "SS. Soteris et Caji Summorum Pontificum et Martyrum",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "04-23",
    "name": "S. Georgii Martyris",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "04-24",
    "name": "S. Fidelis de Sigmaringa Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-25",
    "name": "S. Marci Evangelistæ",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "04-26",
    "name": "SS. Cleti et Marcellini Summorum Pontificum et Martyrum",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "04-27",
    "name": "S. Petri Canisii Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "04-28",
    "name": "S. Pauli a Cruce Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-29",
    "name": "S. Petri Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "04-30",
    "name": "S. Catharinæ Senensis Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-01",
    "name": "Ss. Philippi et Jacobi Apostolorum",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "05-02",
    "name": "S. Athanasii Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-03",
    "name": "Inventione Sanctæ Crucis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "05-04",
    "name": "S. Monicæ Viduæ",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-05",
    "name": "S. Pii V Papæ et Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "05-06",
    "name": "S. Joannis Apostoli ante Portam Latinam",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "05-07",
    "name": "S. Stanislai Episcopi et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-08",
    "name": "In Apparitione S. Michaëlis Archangeli",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "05-09",
    "name": "S. Gregorii Nazianzeni Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-10",
    "name": "S. Antonini Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-12",
    "name": "Ss. Nerei, Achillei et Domitillæ Virg. atque Pancratii Martyrum",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "05-13",
    "name": "S. Roberti Bellarmino Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-14",
    "name": "S. Bonifatii Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "05-15",
    "name": "S. Joannis Baptistæ de la Salle Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-16",
    "name": "S. Ubaldi Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "05-17",
    "name": "S. Paschalis Baylon Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-18",
    "name": "S. Venantii Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-19",
    "name": "S. Petri Celestini Papæ et Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "05-20",
    "name": "S. Bernardini Senensis Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "05-23",
    "name": "S. Joannis Baptistæ de Rossi Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-25",
    "name": "S. Gregorii VII Papæ et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-26",
    "name": "S. Philippi Neri Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-27",
    "name": "S. Bedæ Venerabilis Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-28",
    "name": "S. Augustini Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "05-29",
    "name": "S. Mariæ Magdalenæ de Pazzis Virginis",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "05-30",
    "name": "S. Felicis I Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "05-31",
    "name": "Beatæ Mariæ Virginis Reginæ",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "06-01",
    "name": "S. Angelæ Mericiæ Virginis",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "06-02",
    "name": "Ss. Marcellini, Petri, atque Erasmi, Episcopi, Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "06-04",
    "name": "S. Francisci Caracciolo Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-05",
    "name": "S. Bonifatii Episcopi et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-06",
    "name": "S. Norberti Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-09",
    "name": "Ss. Primi et Feliciani Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "06-10",
    "name": "S. Margaritæ Reginæ Viduæ",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "06-11",
    "name": "S. Barnabæ Apostoli",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "06-12",
    "name": "S. Joannis a S. Facundo Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-13",
    "name": "S. Antonii de Padua Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "06-14",
    "name": "S. Basilii Magni, Episcopis Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-15",
    "name": "Ss. Viti, Modesti atque Crescentiæ Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "06-18",
    "name": "S. Ephræm Syri Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "06-19",
    "name": "S. Julianæ de Falconeriis Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-20",
    "name": "S. Silverii Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "06-21",
    "name": "S. Aloisii Gonzagæ Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-22",
    "name": "S. Paulini Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-23",
    "name": "In Vigilia S. Joannis Baptistæ",
    "rank": 2,
    "gradus": "Simplex"
  },
  {
    "id": "06-24",
    "name": "In Nativitate S. Joannis Baptistæ",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava communi"
  },
  {
    "id": "06-25",
    "name": "S. Gulielmi Abbatis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-26",
    "name": "Ss. Joannis et Pauli Martyrum",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "06-28",
    "name": "S. Irenæi Episcopi et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "06-29",
    "name": "SS. Apostolorum Petri et Pauli",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava communi"
  },
  {
    "id": "06-30",
    "name": "In Commemoratione S. Pauli Apostoli",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "07-01",
    "name": "Pretiosissimi Sanguinis Domini Nostri Jesu Christi",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "07-02",
    "name": "In Visitatione Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "07-03",
    "name": "S. Leonis Papæ et Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-05",
    "name": "S. Antonii Mariæ Zaccaria Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-06",
    "name": "In Octava Ss. Apostolorum Petri et Pauli",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "07-07",
    "name": "Ss. Cyrilli et Methodii Pont. et Conf.",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-08",
    "name": "S. Elisabeth Reg. Portugaliæ Viduæ",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-10",
    "name": "Ss. Septem Fratrum Martyrum, ac Rufinæ et Secundæ Virginum et Martyrum",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-11",
    "name": "S. Pii I Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "07-12",
    "name": "S. Joannis Gualberti Abbatis",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "07-13",
    "name": "S. Anacleti Papæ et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-14",
    "name": "S. Bonaventuræ Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-15",
    "name": "S. Henrici Imperatoris Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-16",
    "name": "In Commemoratione Beatæ Mariæ Virgine de Monte Carmelo",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "07-17",
    "name": "S. Alexii Confessoris",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-18",
    "name": "S. Camilli de Lellis Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-19",
    "name": "S. Vincentii a Paulo Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-20",
    "name": "S. Hieronymi Æmiliani Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-21",
    "name": "S. Praxedis Virginis",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "07-22",
    "name": "S. Mariæ Magdalenæ Pœnitentis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "07-23",
    "name": "S. Apollinaris Episcopi et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "07-24",
    "name": "In Vigilia S. Jacobi Ap.",
    "rank": 4,
    "gradus": "Vigilia"
  },
  {
    "id": "07-25",
    "name": "S. Jacobi Apostoli",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "07-26",
    "name": "S. Annæ Matris B.M.V.",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "07-27",
    "name": "S. Pantaleonis Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "07-28",
    "name": "Ss. Nazarii et Celsi Martyrum, Victoris I Papæ et Martyris ac Innocentii I Papæ et Confessoris",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-29",
    "name": "S. Marthæ Virginis",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "07-30",
    "name": "S. Abdon et Sennen Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "07-31",
    "name": "S. Ignatii Confessoris",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "08-01",
    "name": "S. Petri ad Vincula",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "08-02",
    "name": "S. Alfonsi Mariæ de Ligorio Episc. Conf. et Eccles. Doct.",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "08-03",
    "name": "De Inventione S. Stephani Protomartyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "08-04",
    "name": "S. Dominici Confessoris",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "08-05",
    "name": "Sanctæ Mariæ Virginis ad Nives",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "08-06",
    "name": "In Transfiguratione Domini Nostri Jesu Christi",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "08-07",
    "name": "S. Cajetani Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-08",
    "name": "Ss. Cyriaci, Largi et Smaragdi Martyrum",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "08-09",
    "name": "S. Joannis Mariæ Vianney Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-10",
    "name": "S. Laurentii Martyris",
    "rank": 2,
    "gradus": "Duplex II classis cum Octava simplici"
  },
  {
    "id": "08-11",
    "name": "Ss. Tiburtii et Susannæ Virginis, Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "08-12",
    "name": "S. Claræ Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-13",
    "name": "Ss. Hippolyti et Cassiani Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "08-14",
    "name": "In Vigilia Assumptionis B.M.V.",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "08-15",
    "name": "In Assumptione Beatæ Mariæ Virginis",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava communi"
  },
  {
    "id": "08-16",
    "name": "S. Joachim Confessoris, Patris B. M. V.",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "08-17",
    "name": "S. Hyacinthi Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-19",
    "name": "S. Joannis Eudes Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-20",
    "name": "S. Bernardi Abbatis et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-21",
    "name": "S. Joannæ Franciscæ Frémiot de Chantal Viduæ",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-22",
    "name": "Immaculati Cordis Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "08-23",
    "name": "S. Philippi Benitii Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-24",
    "name": "S. Bartholomæi Apostoli",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "08-25",
    "name": "S. Ludovici Regis Franciæ Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "08-26",
    "name": "S. Zephyrini Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "08-27",
    "name": "S. Josephi Calasanctii Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-28",
    "name": "S. Augustini Episcopi et Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-29",
    "name": "In Decollatione S. Joannis Baptistæ",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "08-30",
    "name": "S. Rosæ a Sancta Maria Limanæ Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "08-31",
    "name": "S. Raymundi Nonnati Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-01",
    "name": "S. Ægidii Abbatis",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "09-02",
    "name": "S. Stephani Hungariæ Regis Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-03",
    "name": "S. Pii X Papæ Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-05",
    "name": "S. Laurentii Justiniani Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-08",
    "name": "In Nativitate Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis cum Octava simplici"
  },
  {
    "id": "09-09",
    "name": "S. Gorgonii Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "09-10",
    "name": "S. Nicolai de Tolentino Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-11",
    "name": "Ss. Proti et Hyacinthi Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "09-12",
    "name": "S. Nominis Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "09-14",
    "name": "In Exaltatione Sanctæ Crucis",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "09-15",
    "name": "Septem Dolorum Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "09-16",
    "name": "Ss. Cornelii Papæ et Cypriani Episcopi, Martyrum",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-17",
    "name": "Impressionis Stigmatum S. Francisci",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "09-18",
    "name": "S. Josephi de Cupertino Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-19",
    "name": "S. Januarii Episcopi et Sociorum Martyrum",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-20",
    "name": "Ss. Eustachii et Sociorum Martyrum",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "09-21",
    "name": "S. Matthæi Apostoli et Evangelistæ",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "09-22",
    "name": "S. Thomæ de Villanova Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "09-23",
    "name": "S. Lini Papæ et Martyris",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-24",
    "name": "Beatæ Mariæ Virginis de Mercede",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "09-26",
    "name": "Ss. Cypriani et Justinæ Virginis, Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "09-27",
    "name": "Ss. Cosmæ et Damiani Martyrum",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-28",
    "name": "S. Wenceslai Ducis et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "09-29",
    "name": "In Dedicatione S. Michaëlis Archangelis",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "09-30",
    "name": "S. Hieronymi Presbyteris Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-01",
    "name": "S. Remigii Episcopi et Confessoris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "10-02",
    "name": "Ss. Angelorum Custodum",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "10-03",
    "name": "S. Theresiæ a Jesu Infante Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-04",
    "name": "S. Francisci Confessoris",
    "rank": 3,
    "gradus": "Duplex majus"
  },
  {
    "id": "10-05",
    "name": "Ss. Placidi et Sociorum Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "10-06",
    "name": "S. Brunonis Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "10-07",
    "name": "Sacratissimi Rosarii Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "10-08",
    "name": "S. Birgittæ Viduæ",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-09",
    "name": "S. Joannis Leonardi Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-10",
    "name": "S. Francisci Borgiæ Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "10-11",
    "name": "Maternitatis Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "10-13",
    "name": "S. Eduardi Regis Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "10-14",
    "name": "S. Callisti Papæ et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "10-15",
    "name": "S. Teresiæ Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-16",
    "name": "S. Hedwigis Viduæ",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "10-17",
    "name": "S. Margaritæ Mariæ Alacoque Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-18",
    "name": "S. Lucæ Evangelistæ",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "10-19",
    "name": "S. Petri de Alcantara Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-20",
    "name": "S. Joannis Cantii Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "10-21",
    "name": "S. Hilarionis Abbatis",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "10-24",
    "name": "S. Raphaëlis Archangeli",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "10-25",
    "name": "Ss. Chrysanthi et Dariæ Martyrum",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "10-26",
    "name": "S. Evaristi Papæ et Martyris",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "10-27",
    "name": "In Vigilia Ss. Simonis et Judæ Ap.",
    "rank": 4,
    "gradus": "Vigilia"
  },
  {
    "id": "10-28",
    "name": "Ss. Simonis et Judæ Apostolorum",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "10-31",
    "name": "In Vigilia Omnium Sanctorum",
    "rank": 4,
    "gradus": "Vigilia"
  },
  {
    "id": "11-01",
    "name": "Omnium Sanctorum",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava communi"
  },
  {
    "id": "11-02",
    "name": "In Commemoratione Omnium Fidelium Defunctorum",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-04",
    "name": "S. Caroli Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-08",
    "name": "In Octava Omnium Sanctorum",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "11-09",
    "name": "In Dedicatione Archibasilicæ Ss. Salvatoris",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "11-10",
    "name": "S. Andreæ Avellini Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-11",
    "name": "S. Martini Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-12",
    "name": "S. Martini Papæ et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "11-13",
    "name": "S. Didaci Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "11-14",
    "name": "S. Josaphat Episcopi et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-15",
    "name": "S. Alberti Magni Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-16",
    "name": "S. Gertrudis Virginis",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-17",
    "name": "S. Gregorii Thaumaturgi Episcopi et Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "11-19",
    "name": "S. Elisabeth Viduæ",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-20",
    "name": "S. Felicis de Valois Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-21",
    "name": "In Præsentatione Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "11-22",
    "name": "S. Cæciliæ Virginis et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-23",
    "name": "S. Clementis Papæ et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "11-24",
    "name": "S. Joannis a Cruce Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "11-25",
    "name": "S. Catharinæ Virginis et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "11-26",
    "name": "S. Silvestri Abbatis",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "11-29",
    "name": "In Vigilia S. Andreæ Apostoli",
    "rank": 4,
    "gradus": "Vigilia"
  },
  {
    "id": "11-30",
    "name": "S. Andreæ Apostoli",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "12-02",
    "name": "S. Bibianæ Virginis et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "12-03",
    "name": "S. Francisci Xaverii Confessoris",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "12-04",
    "name": "S. Petri Chrysologi Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "12-05",
    "name": "S. Sabbæ Abbatis",
    "rank": 4,
    "gradus": "Simplex"
  },
  {
    "id": "12-06",
    "name": "S. Nicolai Episcopi et Confessoris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "12-07",
    "name": "S. Ambrosii Episcopi Confessoris et Ecclesiæ Doctoris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "12-08",
    "name": "In Conceptione Immaculata Beatæ Mariæ Virginis",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava communi"
  },
  {
    "id": "12-11",
    "name": "S. Damasi Papæ et Confessoris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "12-13",
    "name": "S. Luciæ Virginis et Martyris",
    "rank": 3,
    "gradus": "Duplex"
  },
  {
    "id": "12-16",
    "name": "S. Eusebii Episcopi et Martyris",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "12-21",
    "name": "S. Thomæ Apostoli",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "12-24",
    "name": "In Vigilia Nativitatis Domini",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "12-25",
    "name": "In Nativitate Domini",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "12-26",
    "name": "S. Stephani Protomartyris",
    "rank": 2,
    "gradus": "Duplex II classis cum Octava simplici"
  },
  {
    "id": "12-27",
    "name": "S. Joannis Apostoli et Evangelistæ",
    "rank": 2,
    "gradus": "Duplex II classis cum Octava simplici"
  },
  {
    "id": "12-28",
    "name": "Ss. Innocentium",
    "rank": 2,
    "gradus": "Duplex II classis cum Octava simplici"
  },
  {
    "id": "12-29",
    "name": "S. Thomæ Cantuariensis Episcopi et Martyris",
    "rank": 4,
    "gradus": "Duplex"
  },
  {
    "id": "12-31",
    "name": "S. Silvestri Papæ et Confessoris",
    "rank": 3,
    "gradus": "Duplex"
  }
];

export const CAL_TEMPORA: CalEntry[] = [
  {
    "id": "Adv1-0",
    "name": "Dominica I Adventus",
    "rank": 1,
    "gradus": "Semiduplex"
  },
  {
    "id": "Adv1-1",
    "name": "Feria II infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv1-2",
    "name": "Feria III infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv1-3",
    "name": "Feria IV infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv1-4",
    "name": "Feria V infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv1-5",
    "name": "Feria VI infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv1-6",
    "name": "Sabbato infra Hebdomadam I Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-0",
    "name": "Dominica II Adventus",
    "rank": 2,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Adv2-1",
    "name": "Feria II infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-2",
    "name": "Feria III infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-3",
    "name": "Feria IV infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-4",
    "name": "Feria V infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-5",
    "name": "Feria VI infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv2-6",
    "name": "Sabbato infra Hebdomadam II Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-0",
    "name": "Dominica III Adventus",
    "rank": 2,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Adv3-1",
    "name": "Feria II infra Hebdomadam III Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-2",
    "name": "Feria III infra Hebdomadam III Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-3",
    "name": "Feria IV Quattuor Temporum in Adventu",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-4",
    "name": "Feria V infra Hebdomadam III Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-5",
    "name": "Feria VI Quattuor Temporum in Adventu",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Adv3-6",
    "name": "Sabbato Quattuor Temporum in Adventu",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-0",
    "name": "Dominica IV Adventus",
    "rank": 2,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Adv4-1",
    "name": "Feria II infra Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-2",
    "name": "Feria III infra Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-3",
    "name": "Feria IV infra Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-4",
    "name": "Feria V infra Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-5",
    "name": "Feria VI infra Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Adv4-6",
    "name": "Sabbato in Hebdomadam IV Adventus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Epi1-0",
    "name": "Sanctæ Familiæ Jesu Mariæ Joseph",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "Epi1-1",
    "name": "Feria II infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi1-2",
    "name": "Feria III infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi1-3",
    "name": "Feria IV infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi1-4",
    "name": "Feria V infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi1-5",
    "name": "Feria VI infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi1-6",
    "name": "Sabbato infra Hebdomadam I post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-0",
    "name": "Dominica II post Epiphaniam",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Epi2-1",
    "name": "Feria II infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-2",
    "name": "Feria III infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-3",
    "name": "Feria IV infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-4",
    "name": "Feria V infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-5",
    "name": "Feria VI infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi2-6",
    "name": "Sabbato infra Hebdomadam II post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-0",
    "name": "Dominica III Post Epiphaniam",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Epi3-1",
    "name": "Feria II infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-2",
    "name": "Feria III infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-3",
    "name": "Feria IV infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-4",
    "name": "Feria V infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-5",
    "name": "Feria VI infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi3-6",
    "name": "Sabbato infra Hebdomadam III post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-0",
    "name": "Dominica IV Post Epiphaniam",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Epi4-1",
    "name": "Feria Secunda infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-2",
    "name": "Feria Tertia infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-3",
    "name": "Feria IV infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-4",
    "name": "Feria V infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-5",
    "name": "Feria VI infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi4-6",
    "name": "Sabbato infra Hebdomadam IV post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-0",
    "name": "Dominica V Post Epiphaniam",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Epi5-1",
    "name": "Feria II infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-2",
    "name": "Feria III infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-3",
    "name": "Feria IV infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-4",
    "name": "Feria V infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-5",
    "name": "Feria VI infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi5-6",
    "name": "Sabbato infra Hebdomadam V post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-0",
    "name": "Dominica VI Post Epiphaniam",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Epi6-1",
    "name": "Feria II infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-2",
    "name": "Feria III infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-3",
    "name": "Feria IV infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-4",
    "name": "Feria V infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-5",
    "name": "Feria VI infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Epi6-6",
    "name": "Sabbato infra Hebdomadam VI post Epiphaniam",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Nat1-0",
    "name": "Dominica Infra Octavam Nativitatis",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Nat2-0",
    "name": "Sanctissimi Nominis Jesu",
    "rank": 2,
    "gradus": "Duplex II classis"
  },
  {
    "id": "Pasc0-0",
    "name": "Dominica Resurrectionis",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava privilegiata I ordinis"
  },
  {
    "id": "Pasc0-1",
    "name": "Die II infra octavam Paschæ",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pasc0-2",
    "name": "Die III infra octavam Paschæ",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pasc0-3",
    "name": "Die IV infra octavam Paschæ",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc0-4",
    "name": "Die V infra octavam Paschæ",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc0-5",
    "name": "Die VI infra octavam Paschæ",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc0-6",
    "name": "Sabbato in Albis",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc1-0",
    "name": "Dominica in Albis in Octava Paschæ",
    "rank": 1,
    "gradus": "Duplex majus I classis"
  },
  {
    "id": "Pasc1-1",
    "name": "Feria Secunda infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc1-2",
    "name": "Feria Tertia infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc1-3",
    "name": "Feria Quarta infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc1-4",
    "name": "Feria Quinta infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc1-5",
    "name": "Feria Sexta infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc1-6",
    "name": "Sabbato infra Hebdomadam I post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc2-0",
    "name": "Dominica II Post Pascha",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc2-1",
    "name": "Feria Secunda infra Hebdomadam II post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc2-2",
    "name": "Feria Tertia infra Hebdomadam II post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc2-3",
    "name": "Patrocinii St. Joseph Confessoris Sponsi B.M.V. Confessoris",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pasc2-4",
    "name": "De II die infra Octavam S. Joseph",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc2-5",
    "name": "De III die infra Octavam S. Joseph",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc2-6",
    "name": "De IV die infra Octavam S. Joseph",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc3-0",
    "name": "Dominica III Post Pascha",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc3-1",
    "name": "De VI die infra Octavam S. Joseph",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc3-2",
    "name": "De VII die infra Octavam S. Joseph",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc3-3",
    "name": "In Octava Patrocinii S. Joseph",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "Pasc3-4",
    "name": "Feria Quinta infra Hebdomadam III post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc3-5",
    "name": "Feria Sexta infra Hebdomadam III post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc3-6",
    "name": "Sabbato infra Hebdomadam III post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-0",
    "name": "Dominica IV Post Pascha",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc4-1",
    "name": "Feria Secunda infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-2",
    "name": "Feria Tertia infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-3",
    "name": "Feria Quarta infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-4",
    "name": "Feria Quinta infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-5",
    "name": "Feria Sexta infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc4-6",
    "name": "Sabbato infra Hebdomadam IV post Octavam Paschæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc5-0",
    "name": "Dominica V Post Pascha",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc5-1",
    "name": "Feria Secunda in Rogationibus",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Pasc5-2",
    "name": "Feria Tertia in Rogationibus",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pasc5-3",
    "name": "Feria Quarta in Rogationibus in Vigilia Ascensionis",
    "rank": 4,
    "gradus": "Vigilia"
  },
  {
    "id": "Pasc5-4",
    "name": "In Ascensione Domini",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava privilegiata III ordinis"
  },
  {
    "id": "Pasc5-5",
    "name": "Feria VI infra Octavam Ascensionis",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc5-6",
    "name": "Sabbato infra Octavam Ascensionis",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc6-0",
    "name": "Dominica infra Octavam Ascensionis",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc6-1",
    "name": "Feria II infra Octavam Ascensionis",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc6-2",
    "name": "Feria III infra Octavam Ascensionis",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc6-3",
    "name": "Feria IV infra Octavam Ascensionis",
    "rank": 4,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pasc6-4",
    "name": "In Octava Ascensionis",
    "rank": 4,
    "gradus": "Duplex majus"
  },
  {
    "id": "Pasc6-6",
    "name": "Sabbato in Vigilia Pentecostes",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc7-0",
    "name": "Dominica Pentecostes",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava privilegiata I ordinis"
  },
  {
    "id": "Pasc7-1",
    "name": "Die II infra octavam Pentecostes",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pasc7-2",
    "name": "Die III infra octavam Pentecostes",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pasc7-3",
    "name": "Feria Quarta Quattuor Temporum Pentecostes",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc7-4",
    "name": "Feria Quinta infra octavam Pentecostes",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc7-5",
    "name": "Feria Sexta Quattuor Temporum Pentecostes",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pasc7-6",
    "name": "Sabbato Quattuor Temporum Pentecostes",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pent01-0",
    "name": "Dominica Sanctissimæ Trinitatis",
    "rank": 1,
    "gradus": "Duplex I classis"
  },
  {
    "id": "Pent01-1",
    "name": "Feria Secunda infra Hebdomadam I post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent01-2",
    "name": "Feria Tertia infra Hebdomadam I post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent01-3",
    "name": "Feria Quarta infra Hebdomadam I post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent01-4",
    "name": "Festum Sanctissimi Corporis Christi",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava privilegiata II ordinis"
  },
  {
    "id": "Pent01-5",
    "name": "Feria Sexta infra octavam Corporis Christi",
    "rank": 4,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Pent01-6",
    "name": "Sabbato infra octavam Corporis Christi",
    "rank": 4,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Pent02-0",
    "name": "Dominica II Post Pentecosten infra Octavam Corporis Christi",
    "rank": 2,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Pent02-1",
    "name": "Feria Secunda infra Octavam Corporis Christi",
    "rank": 4,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Pent02-2",
    "name": "Feria Tertia infra Octavam Corporis Christi",
    "rank": 4,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Pent02-3",
    "name": "Feria Quarta infra Octavam Corporis Christi",
    "rank": 4,
    "gradus": "Semiduplex II classis"
  },
  {
    "id": "Pent02-4",
    "name": "In Octava Sanctissimi Corporis Christi",
    "rank": 4,
    "gradus": "Duplex majus"
  },
  {
    "id": "Pent02-5",
    "name": "Sacratissimi Cordis Domini Nostri Jesu Christi",
    "rank": 1,
    "gradus": "Duplex I classis cum Octava privilegiata III ordinis"
  },
  {
    "id": "Pent02-6",
    "name": "Die II infra Octavam SSmi Cordis Jesu",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-0",
    "name": "Dominica III Post Pentecosten infra Octavam SSmi Cordis D.N.J.C",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-1",
    "name": "Die IV infra Octavam SSmi Cordis Jesu",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-2",
    "name": "Die V infra Octavam SSmi Cordis Jesu",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-3",
    "name": "Die VI infra Octavam SSmi Cordis Jesu",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-4",
    "name": "Die VII infra Octavam SSmi Cordis Jesu",
    "rank": 3,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent03-5",
    "name": "In Octava SSmi Cordis Jesu",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "Pent03-6",
    "name": "Sabbato infra Hebdomadam III post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-0",
    "name": "Dominica IV Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent04-1",
    "name": "Feria secunda infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-2",
    "name": "Feria tertia infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-3",
    "name": "Feria quarta infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-4",
    "name": "Feria quinta infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-5",
    "name": "Feria sexta infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent04-6",
    "name": "Sabbato infra Hebdomadam IV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-0",
    "name": "Dominica V Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent05-1",
    "name": "Feria secunda infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-2",
    "name": "Feria tertia infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-3",
    "name": "Feria quarta infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-4",
    "name": "Feria quinta infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-5",
    "name": "Feria sexta infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent05-6",
    "name": "Sabbato infra Hebdomadam V post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-0",
    "name": "Dominica VI Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent06-1",
    "name": "Feria secunda infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-2",
    "name": "Feria tertia infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-3",
    "name": "Feria quarta infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-4",
    "name": "Feria quinta infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-5",
    "name": "Feria sexta infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent06-6",
    "name": "Sabbato infra Hebdomadam VI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-0",
    "name": "Dominica VII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent07-1",
    "name": "Feria secunda infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-2",
    "name": "Feria tertia infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-3",
    "name": "Feria quarta infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-4",
    "name": "Feria quinta infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-5",
    "name": "Feria sexta infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent07-6",
    "name": "Sabbato infra Hebdomadam VII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-0",
    "name": "Dominica VIII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent08-1",
    "name": "Feria secunda infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-2",
    "name": "Feria tertia infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-3",
    "name": "Feria quarta infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-4",
    "name": "Feria quinta infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-5",
    "name": "Feria sexta infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent08-6",
    "name": "Sabbato infra Hebdomadam VIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-0",
    "name": "Dominica IX Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent09-1",
    "name": "Feria secunda infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-2",
    "name": "Feria tertia infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-3",
    "name": "Feria quarta infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-4",
    "name": "Feria quinta infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-5",
    "name": "Feria sexta infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent09-6",
    "name": "Sabbato secunda infra Hebdomadam IX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-0",
    "name": "Dominica X Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent10-1",
    "name": "Feria secunda infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-2",
    "name": "Feria tertia infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-3",
    "name": "Feria quarta infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-4",
    "name": "Feria quinta infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-5",
    "name": "Feria sexta infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent10-6",
    "name": "Sabbato infra Hebdomadam X post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-0",
    "name": "Dominica XI Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent11-1",
    "name": "Feria secunda infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-2",
    "name": "Feria tertia infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-3",
    "name": "Feria quarta infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-4",
    "name": "Feria quinta infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-5",
    "name": "Feria sexta infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent11-6",
    "name": "Sabbato infra Hebdomadam XI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-0",
    "name": "Dominica XII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent12-1",
    "name": "Feria secunda infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-2",
    "name": "Feria Tertia infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-3",
    "name": "Feria Quarta infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-4",
    "name": "Feria Quinta infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-5",
    "name": "Feria Sexta infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent12-6",
    "name": "Sabbato infra Hebdomadam XII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-0",
    "name": "Dominica XIII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent13-1",
    "name": "Feria Secunda infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-2",
    "name": "Feria Tertia infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-3",
    "name": "Feria Quarta infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-4",
    "name": "Feria Quinta infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-5",
    "name": "Feria Sexta infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent13-6",
    "name": "Sabbato infra Hebdomadam XIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-0",
    "name": "Dominica XIV Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent14-1",
    "name": "Feria Secunda infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-2",
    "name": "Feria Tertia infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-3",
    "name": "Feria Quarta infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-4",
    "name": "Feria Quinta infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-5",
    "name": "Feria Sexta infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent14-6",
    "name": "Sabbato infra Hebdomadam XIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-0",
    "name": "Dominica XV Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent15-1",
    "name": "Feria Secunda infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-2",
    "name": "Feria Tertia infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-3",
    "name": "Feria Quarta infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-4",
    "name": "Feria Quinta infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-5",
    "name": "Feria Sexta infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent15-6",
    "name": "Sabbato infra Hebdomadam XV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-0",
    "name": "Dominica XVI Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent16-1",
    "name": "Feria Secunda infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-2",
    "name": "Feria Tertia infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-3",
    "name": "Feria Quarta infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-4",
    "name": "Feria Quinta infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-5",
    "name": "Feria Sexta infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent16-6",
    "name": "Sabbato infra Hebdomadam XVI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-0",
    "name": "Dominica XVII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent17-1",
    "name": "Feria Secunda infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-2",
    "name": "Feria Tertia infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-3",
    "name": "Feria Quarta infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-4",
    "name": "Feria Quinta infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-5",
    "name": "Feria Sexta infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent17-6",
    "name": "Sabbato infra Hebdomadam XVII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-0",
    "name": "Dominica XVIII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent18-1",
    "name": "Feria Secunda infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-2",
    "name": "Feria Tertia infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-3",
    "name": "Feria Quarta infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-4",
    "name": "Feria Quinta infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-5",
    "name": "Feria Sexta infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent18-6",
    "name": "Sabbato infra Hebdomadam XVIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-0",
    "name": "Dominica XIX Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent19-1",
    "name": "Feria Secunda infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-2",
    "name": "Feria Tertia infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-3",
    "name": "Feria Quarta infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-4",
    "name": "Feria Quinta infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-5",
    "name": "Feria Sexta infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent19-6",
    "name": "Sabbato infra Hebdomadam XIX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-0",
    "name": "Dominica XX Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent20-1",
    "name": "Feria Secunda infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-2",
    "name": "Feria Tertia infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-3",
    "name": "Feria Quarta infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-4",
    "name": "Feria Quinta infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-5",
    "name": "Feria Sexta infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent20-6",
    "name": "Sabbato infra Hebdomadam XX post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-0",
    "name": "Dominica XXI Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent21-1",
    "name": "Feria Secunda infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-2",
    "name": "Feria Tertia infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-3",
    "name": "Feria Quarta infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-4",
    "name": "Feria Quinta infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-5",
    "name": "Feria Sexta infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent21-6",
    "name": "Sabbato infra Hebdomadam XXI post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-0",
    "name": "Dominica XXII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent22-1",
    "name": "Feria Secunda infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-2",
    "name": "Feria Tertia infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-3",
    "name": "Feria Quarta infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-4",
    "name": "Feria Quinta infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-5",
    "name": "Feria Sexta infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent22-6",
    "name": "Sabbato infra Hebdomadam XXII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-0",
    "name": "Dominica XXIII Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent23-1",
    "name": "Feria Secunda infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-2",
    "name": "Feria Tertia infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-3",
    "name": "Feria Quarta infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-4",
    "name": "Feria Quinta infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-5",
    "name": "Feria Sexta infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent23-6",
    "name": "Sabbato infra Hebdomadam XXIII post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-0",
    "name": "Dominica XXIV et Ultima Post Pentecosten",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Pent24-1",
    "name": "Feria Secunda infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-2",
    "name": "Feria Tertia infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-3",
    "name": "Feria Quarta infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-4",
    "name": "Feria Quinta infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-5",
    "name": "Feria Sexta infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Pent24-6",
    "name": "Sabbato infra Hebdomadam XXIV post Octavam Pentecostes",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quad1-0",
    "name": "Dominica I in Quadragesima",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad1-1",
    "name": "Feria Secunda infra Hebdomadam I in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad1-2",
    "name": "Feria Tertia infra Hebdomadam I in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad1-3",
    "name": "Feria Quarta Quattuor Temporum Quadragesimæ",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Quad1-4",
    "name": "Feria Quinta infra Hebdomadam I in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad1-5",
    "name": "Feria Sexta Quattuor Temporum Quadragesimæ",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Quad1-6",
    "name": "Sabbato Quattuor Temporum Quadragesimæ",
    "rank": 2,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-0",
    "name": "Dominica II in Quadragesima",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad2-1",
    "name": "Feria Secunda infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-2",
    "name": "Feria Tertia infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-3",
    "name": "Feria Quarta infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-4",
    "name": "Feria Quinta infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-5",
    "name": "Feria Sexta infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad2-6",
    "name": "Sabbato infra Hebdomadam II in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-0",
    "name": "Dominica III in Quadragesima",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad3-1",
    "name": "Feria Secunda infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-2",
    "name": "Feria Tertia infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-3",
    "name": "Feria Quarta infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-4",
    "name": "Feria Quinta infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-5",
    "name": "Feria Sexta infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad3-6",
    "name": "Sabbato infra Hebdomadam III in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-0",
    "name": "Dominica IV in Quadragesima",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad4-1",
    "name": "Feria Secunda infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-2",
    "name": "Feria Tertia infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-3",
    "name": "Feria Quarta infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-4",
    "name": "Feria Quinta infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-5",
    "name": "Feria Sexta infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad4-6",
    "name": "Sabbato infra Hebdomadam IV in Quadragesima",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad5-0",
    "name": "Dominica de Passione",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad5-1",
    "name": "Feria Secunda infra Hebdomadam Passionis",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad5-2",
    "name": "Feria Tertia infra Hebdomadam Passionis",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad5-3",
    "name": "Feria Quarta infra Hebdomadam Passionis",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad5-4",
    "name": "Feria Quinta infra Hebdomadam Passionis",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad5-5",
    "name": "Septem Dolorum Beatæ Mariæ Virginis",
    "rank": 2,
    "gradus": "Duplex majus"
  },
  {
    "id": "Quad5-6",
    "name": "Sabbato infra Hebdomadam Passionis",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quad6-0",
    "name": "Dominica in Palmis",
    "rank": 1,
    "gradus": "Semiduplex I classis"
  },
  {
    "id": "Quad6-1",
    "name": "Feria Secunda Majoris Hebdomadæ",
    "rank": 1,
    "gradus": "Feria privilegiata"
  },
  {
    "id": "Quad6-2",
    "name": "Feria Tertia Majoris Hebdomadæ",
    "rank": 1,
    "gradus": "Feria privilegiata"
  },
  {
    "id": "Quad6-3",
    "name": "Feria Quarta Majoris Hebdomadæ",
    "rank": 1,
    "gradus": "Feria privilegiata"
  },
  {
    "id": "Quad6-4",
    "name": "Feria Quinta in Cena Domini",
    "rank": 1,
    "gradus": "Feria privilegiata Duplex I classis"
  },
  {
    "id": "Quad6-5",
    "name": "Feria Sexta in Parasceve",
    "rank": 1,
    "gradus": "Feria privilegiata Duplex I classis"
  },
  {
    "id": "Quad6-6",
    "name": "Sabbato Sancto",
    "rank": 1,
    "gradus": "Feria privilegiata Duplex I classis"
  },
  {
    "id": "Quadp1-0",
    "name": "Dominica in Septuagesima",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Quadp1-1",
    "name": "Feria II infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp1-2",
    "name": "Feria III infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp1-3",
    "name": "Feria IV infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp1-4",
    "name": "Feria V infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp1-5",
    "name": "Feria VI infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp1-6",
    "name": "Sabbato infra Hebdomadam Septuagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-0",
    "name": "Dominica in Sexagesima",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Quadp2-1",
    "name": "Feria II infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-2",
    "name": "Feria III infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-3",
    "name": "Feria IV infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-4",
    "name": "Feria V infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-5",
    "name": "Feria VI infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp2-6",
    "name": "Sabbato infra Hebdomadam Sexagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp3-0",
    "name": "Dominica in Quinquagesima",
    "rank": 2,
    "gradus": "Semiduplex"
  },
  {
    "id": "Quadp3-1",
    "name": "Feria II infra Hebdomadam Quinquagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp3-2",
    "name": "Feria III infra Hebdomadam Quinquagesimæ",
    "rank": 4,
    "gradus": "Feria"
  },
  {
    "id": "Quadp3-3",
    "name": "Feria IV Cinerum",
    "rank": 1,
    "gradus": "Feria privilegiata"
  },
  {
    "id": "Quadp3-4",
    "name": "Feria V post Cineres",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quadp3-5",
    "name": "Feria VI post Cineres",
    "rank": 3,
    "gradus": "Feria major"
  },
  {
    "id": "Quadp3-6",
    "name": "Sabbato post Cineres",
    "rank": 3,
    "gradus": "Feria major"
  }
];

export const CAL: CalEntry[] = [...CAL_SANCTI, ...CAL_TEMPORA];
