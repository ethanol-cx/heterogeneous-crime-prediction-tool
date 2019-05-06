class gridShapeConverter:
    regex = '(\d+),(\d+)'

    def to_python(self, value):
        return tuple([int(gridshape) for gridshape in value.split(',')])
