import sys, io, json, traceback

def __pypop_run(code, inputs):
    out = io.StringIO()
    old_out = sys.stdout
    sys.stdout = out
    queue = [str(v) for v in inputs]
    missing = [0]
    def _input(prompt=""):
        out.write(str(prompt))
        if queue:
            value = queue.pop(0)
        else:
            value = ""
            missing[0] += 1
        out.write(value + "\n")
        return value
    ns = {"__name__": "__main__", "input": _input}
    err = None
    try:
        exec(compile(code, "<dein-code>", "exec"), ns)
    except SystemExit:
        pass
    except SyntaxError as e:
        err = {"type": type(e).__name__, "msg": str(e.msg), "line": e.lineno}
    except Exception as e:
        line = None
        for fr in traceback.extract_tb(e.__traceback__):
            if fr.filename == "<dein-code>":
                line = fr.lineno
        err = {"type": type(e).__name__, "msg": str(e), "line": line}
    finally:
        sys.stdout = old_out
    text = out.getvalue()
    if len(text) > 20000:
        text = text[:20000] + "\n...(Ausgabe gekürzt)"
    return json.dumps({"out": text, "err": err, "missingInputs": missing[0]})
