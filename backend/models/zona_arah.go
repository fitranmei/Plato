package models

type ZonaArah struct {
	ID   int    `bson:"_id" json:"id"`
	Nama string `bson:"nama" json:"nama"`
}

var DefaultZonaArah = []ZonaArah{
	{ID: 1, Nama: "Utara"},
	{ID: 2, Nama: "Timur Laut"},
	{ID: 3, Nama: "Timur"},
	{ID: 4, Nama: "Tenggara"},
	{ID: 5, Nama: "Selatan"},
	{ID: 6, Nama: "Barat Daya"},
	{ID: 7, Nama: "Barat"},
	{ID: 8, Nama: "Barat Laut"},
}

func GetZonaArahByID(id int) *ZonaArah {
	for _, zona := range DefaultZonaArah {
		if zona.ID == id {
			return &zona
		}
	}
	return nil
}
