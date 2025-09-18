---
name: List items
about: List items
title: ''
labels: enhancement
assignees: ''
---

### Detailed Description

<!--- Provide a detailed description of the change or addition you are proposing -->

### Additional context

### Task requirements

- [ ]

### Route

`GET /v4/prefeituras/:prefeitura_id`

### Parameters

| Parameter     | Description      | Type    |
| ------------- | ---------------- | ------- |
| prefeitura_id | Id da prefeitura | integer |

### Query parameters

| Parameter | Example          |
| --------- | ---------------- |
| pagina    | 1                |
| limite    | 20               |
| filtro    | {"id": {"eq":1}} |
| ordem     | [{"id": "asc"}]  |

### Filters

```bash
filtro={"id": {"eq":1}}
filtro={"data": {"gte":"2019-12-05 00:00:00", "lte":"2019-12-05 23:59:00"}}
```

### Order

```bash
ordem=[{"id": "asc"}]
ordem=[{"data_criacao": "desc"}]
```

### Data retrieved

`HTTP 200 OK`

```json
{
  "metadados": {
    "total": 1,
    "pagina": 1,
    "limite": 20
  },
  "resultado": [
    {
      "id": 1,
      "nome": "Prefeitura"
    }
  ]
}
```

### Possible Implementation

<!--- Not obligatory, but suggest an idea for implementing addition or change -->
