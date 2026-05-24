export const sampleData = {
  csv: "Name,Age,City\nTaro,25,Tokyo\nHanako,30,Osaka\nJiro,28,Kyoto",
  tsv: "Name\tAge\tCity\nTaro\t25\tTokyo\nHanako\t30\tOsaka\nJiro\t28\tKyoto",
  html: `<table>
  <tr><th>Name</th><th>Age</th><th>City</th></tr>
  <tr><td>Taro</td><td>25</td><td>Tokyo</td></tr>
  <tr><td>Hanako</td><td>30</td><td>Osaka</td></tr>
</table>`,
  excel: "Name,Age,City\nTaro,25,Tokyo\nHanako,30,Osaka\nJiro,28,Kyoto",
  markdown: `| Name | Age | City |
| --- | --- | --- |
| Taro | 25 | Tokyo |
| Hanako | 30 | Osaka |`,
  latex: `\\begin{tabular}{|l|l|l|}
\\hline
Name & Age & City \\\\
\\hline
Taro & 25 & Tokyo \\\\
Hanako & 30 & Osaka \\\\
\\hline
\\end{tabular}`,
  sql: `INSERT INTO sample_table (Name, Age, City) VALUES ('Taro', '25', 'Tokyo');
INSERT INTO sample_table (Name, Age, City) VALUES ('Hanako', '30', 'Osaka');
INSERT INTO sample_table (Name, Age, City) VALUES ('Jiro', '28', 'Kyoto');`,
  json: `[
  {"Name":"Taro","Age":25,"City":"Tokyo"},
  {"Name":"Hanako","Age":30,"City":"Osaka"},
  {"Name":"Jiro","Age":28,"City":"Kyoto"}
]`,
  yaml: `- Name: Taro
  Age: 25
  City: Tokyo
- Name: Hanako
  Age: 30
  City: Osaka`,
  xml: `<?xml version="1.0" encoding="UTF-8"?>
<data>
  <record>
    <Name>Taro</Name>
    <Age>25</Age>
    <City>Tokyo</City>
  </record>
  <record>
    <Name>Hanako</Name>
    <Age>30</Age>
    <City>Osaka</City>
  </record>
</data>`,
  ascii: `+--------+-----+-------+
| Name   | Age | City  |
+--------+-----+-------+
| Taro   | 25  | Tokyo |
| Hanako | 30  | Osaka |
+--------+-----+-------+`,
  toml: `# 示例TOML数据\n[[records]]\nName = "Taro"\nAge = 25\nCity = "Tokyo"\n\n[[records]]\nName = "Hanako"\nAge = 30\nCity = "Osaka"\n\n[[records]]\nName = "Jiro"\nAge = 28\nCity = "Kyoto"`,
}

// 导出TOML示例数据
export const sampleTomlData = sampleData.toml;

// 导出YAML示例数据
export const sampleYamlData = sampleData.yaml;