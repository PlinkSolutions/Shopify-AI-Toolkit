"""Banco vivo de ideas (docs/holo/ideas.json): lo que el agente creador lee,
amplía con tendencias y marca al producir, para no repetir temas.

usage (desde video/):
  ideas.py libres [--cat cuerpo] [--tag tendencia]      ideas sin usar, compactas
  ideas.py ver N                                         una idea completa
  ideas.py agregar --cat C --hook H --gist G --visual V --cta A [--tags t1,t2] [--fuente URL]
  ideas.py reservar N --slug NN-palabra                  al empezar un reel (evita choques entre ejecuciones)
  ideas.py hecha N --slug NN-palabra                     al entregar el reel
  ideas.py liberar N                                     si un reel se abandona
  ideas.py md                                            regenera docs/holo/ideas.md
Estados: libre · reservada · hecha. Cada cambio regenera ideas.md.
"""
import argparse, datetime, json, os

PATH = os.path.join(os.path.dirname(__file__), "../../docs/holo/ideas.json")
MD = os.path.join(os.path.dirname(PATH), "ideas.md")


def load():
    d = json.load(open(PATH, encoding="utf8"))
    for i in d["ideas"]:
        i.setdefault("estado", "libre")
    return d


def save(d):
    json.dump(d, open(PATH, "w", encoding="utf8"), ensure_ascii=False, indent=1)
    render(d)


def render(d):
    mark = {"libre": "", "reservada": " 🔒 en producción", "hecha": " ✅ hecha"}
    lines = ["# Banco de ideas · Ciencia holográfica", "",
             "Etiquetas: **base** (ciencia establecida) · **hipótesis** (decir «los científicos creen…») · **misterio** · **tendencia** · **verificar** (confirmar dato o estudio antes del guion) · ⭐ recomendada.",
             "Estados: 🔒 en producción · ✅ hecha (con su reel). Se actualiza con `scripts/holo/ideas.py`.", ""]
    for key, name in d["cats"].items():
        lines += [f"## {name}", ""]
        for i in d["ideas"]:
            if i["cat"] != key:
                continue
            star = " ⭐" if "top" in i["tags"] else ""
            tags = ", ".join(t for t in i["tags"] if t != "top")
            reel = f" ({i['slug']})" if i.get("slug") else ""
            lines += [f"**{i['n']}. {i['hook']}**{star}{mark[i['estado']]}{reel}",
                      f"- Respuesta: {i['gist']}",
                      f"- Visual: {i['visual']}",
                      f"- CTA: {i['cta']}",
                      f"- Etiquetas: {tags}" + (f" · fuente: {i['fuente']}" if i.get("fuente") else ""), ""]
    open(MD, "w", encoding="utf8").write("\n".join(lines))


def find(d, n):
    for i in d["ideas"]:
        if i["n"] == n:
            return i
    raise SystemExit(f"no existe la idea {n}")


def main():
    p = argparse.ArgumentParser()
    sub = p.add_subparsers(dest="cmd", required=True)
    s = sub.add_parser("libres"); s.add_argument("--cat"); s.add_argument("--tag")
    s = sub.add_parser("ver"); s.add_argument("n", type=int)
    s = sub.add_parser("agregar")
    for a in ("cat", "hook", "gist", "visual", "cta"):
        s.add_argument(f"--{a}", required=True)
    s.add_argument("--tags", default="tendencia"); s.add_argument("--fuente")
    for c in ("reservar", "hecha"):
        s = sub.add_parser(c); s.add_argument("n", type=int); s.add_argument("--slug", required=True)
    s = sub.add_parser("liberar"); s.add_argument("n", type=int)
    sub.add_parser("md")
    a = p.parse_args()
    d = load()
    today = datetime.date.today().isoformat()

    if a.cmd == "libres":
        for i in d["ideas"]:
            if i["estado"] == "libre" and (not a.cat or i["cat"] == a.cat) and (not a.tag or a.tag in i["tags"]):
                print(f"{i['n']:>3} [{i['cat']}] {','.join(i['tags'])} · {i['hook']}")
    elif a.cmd == "ver":
        print(json.dumps(find(d, a.n), ensure_ascii=False, indent=1))
    elif a.cmd == "agregar":
        if a.cat not in d["cats"]:
            raise SystemExit(f"categoría desconocida: {a.cat} (usa {', '.join(d['cats'])})")
        n = max(i["n"] for i in d["ideas"]) + 1
        idea = dict(cat=a.cat, hook=a.hook, gist=a.gist, visual=a.visual, cta=a.cta, tags=[t for t in a.tags.split(",") if t], n=n, estado="libre", alta=today)
        if a.fuente:
            idea["fuente"] = a.fuente
        d["ideas"].append(idea)
        save(d)
        print("agregada", n)
    elif a.cmd in ("reservar", "hecha"):
        i = find(d, a.n)
        if a.cmd == "reservar" and i["estado"] != "libre":
            raise SystemExit(f"la idea {a.n} ya está {i['estado']} ({i.get('slug')})")
        i.update(estado="reservada" if a.cmd == "reservar" else "hecha", slug=a.slug, fecha=today)
        save(d)
        print(a.cmd, a.n, a.slug)
    elif a.cmd == "liberar":
        i = find(d, a.n)
        for k in ("slug", "fecha"):
            i.pop(k, None)
        i["estado"] = "libre"
        save(d)
        print("liberada", a.n)
    elif a.cmd == "md":
        render(d)
        print("ok", MD)


main()
